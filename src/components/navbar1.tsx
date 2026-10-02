"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, ArrowUpRight, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ModeToggleCompact } from "@/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getCurrentUser, logout } from "@/lib/auth";

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}
interface Navbar1Props {
  className?: string;
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
    className?: string;
  };
  menu?: MenuItem[];
  auth?: {
    login: { title: string; url: string };
    signup: { title: string; url: string };
  };
}

/** Circular avatar with fallback initials */
function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-1 ring-border transition hover:ring-primary/40">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        initials || "U"
      )}
    </span>
  );
}

export function Navbar1({
  className,
  logo,
  menu,
  auth = {
    login: { title: "Sign in", url: "/login" },
    signup: { title: "Register free", url: "/register" },
  },
}: Navbar1Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Session check — same pattern as nav-user.tsx
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => { void queryClient.invalidateQueries({ queryKey: ["current-user"] }); }, [pathname, queryClient]);

  const isLoggedIn = Boolean(user);

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.push("/");
    router.refresh();
  };

  const defaults = [
    { title: "How it works", url: "/howitworks" },
    { title: "Templates", url: "/templates" },
    { title: "Pricing", url: "/pricing" },
    { title: "Help", url: "/help" },
  ];
  const seen = new Set<string>();
  const links = (
    menu?.length
      ? menu.flatMap((item) => (item.items?.length ? item.items : [item]))
      : defaults
  ).filter((item) => {
    if (!item.url || item.url === "#" || item.url === "/" || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  const navLinks = links.map((item) => (
    <Link
      key={item.url}
      href={item.url.startsWith("#") ? `/${item.url}` : item.url}
      aria-current={pathname === item.url ? "page" : undefined}
      onClick={() => setOpen(false)}
      className="studio-nav-link"
    >
      {item.title}
    </Link>
  ));

  const userName = user
    ? [user.profile?.firstName ?? "", user.profile?.lastName ?? ""].filter(Boolean).join(" ") ||
      user.name || user.email
    : "";

  return (
    <header className={cn("studio-nav studio-nav-premium", className)}>
      <a className="studio-skip" href="#main">
        Skip to content
      </a>
      <div className="studio-container studio-nav-shell flex items-center justify-between gap-5">
        <Link
          href={logo?.url || "/"}
          className="studio-brand"
          aria-label={`${logo?.alt || "ProfileAI"} home`}
        >
          <Image src="/brand/profileai-mark.svg" alt="" width={40} height={40} className="studio-logo-mark" priority />
          <span>{logo?.title || "ProfileAI"}</span>
        </Link>
        <nav aria-label="Main navigation" className="studio-nav-links hidden items-center lg:flex">
          {navLinks}
        </nav>
        <div className="flex items-center gap-3">
          <ModeToggleCompact />

          {/* Desktop auth section */}
          {isLoggedIn ? (
            /* Logged in: avatar dropdown */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="User menu"
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <UserAvatar name={userName} avatarUrl={user?.profile?.avatarUrl || user?.image} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/login/2fa/setup"><ShieldCheck className="h-4 w-4" />Account security</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Logged out: Login + Get started */
            <>
              <Link href={auth.login.url} className="studio-text-link flex whitespace-nowrap">
                {auth.login.title}
              </Link>
              <Link href={auth.signup.url} className="studio-button hidden sm:flex">
                {auth.signup.title}
                <ArrowUpRight size={15} />
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent className="studio-mobile-nav">
              <SheetHeader>
                <SheetTitle>Your next chapter</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile navigation" className="flex flex-col gap-5 p-6">
                {navLinks}
                <hr />
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={userName} avatarUrl={user?.profile?.avatarUrl || user?.image} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{userName}</p>
                        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <Link onClick={() => setOpen(false)} href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={async () => { setOpen(false); await handleLogout(); }}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link onClick={() => setOpen(false)} href={auth.login.url}>
                      {auth.login.title}
                    </Link>
                    <Link
                      onClick={() => setOpen(false)}
                      className="studio-button"
                      href={auth.signup.url}
                    >
                      {auth.signup.title}
                      <ArrowUpRight size={16} />
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
