"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ModeToggleCompact } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
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
export function Navbar1({
  className,
  logo,
  menu,
  auth = {
    login: { title: "Log in", url: "/login" },
    signup: { title: "Get started", url: "/register" },
  },
}: Navbar1Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const defaults = [
    { title: "How it works", url: "/#workflow" },
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
    if (!item.url || item.url === "#" || item.url === "/" || seen.has(item.url))
      return false;
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
          <Image src="/brand/profileai-mark.svg" alt="" width={40} height={40} className="studio-logo-mark" />
          <span>{logo?.title || "ProfileAI"}</span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="studio-nav-links hidden items-center lg:flex"
        >
          {navLinks}
        </nav>
        <div className="flex items-center gap-3">
          <ModeToggleCompact />
          <Link
            href={auth.login.url}
            className="studio-text-link hidden sm:flex"
          >
            {auth.login.title}
          </Link>
          <Link href={auth.signup.url} className="studio-button hidden sm:flex">
            {auth.signup.title}
            <ArrowUpRight size={15} />
          </Link>
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
              <nav
                aria-label="Mobile navigation"
                className="flex flex-col gap-5 p-6"
              >
                {navLinks}
                <hr />
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
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
