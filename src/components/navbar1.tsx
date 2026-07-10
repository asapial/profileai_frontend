"use client";

import { Book, Menu, Sunset, Trees, Zap, Sparkles } from "lucide-react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
    login: {
      title: string;
      url: string;
    };
    signup: {
      title: string;
      url: string;
    };
  };
}

const Navbar1 = ({
  logo = {
    url: "/",
    src: "",
    alt: "ProFile AI",
    title: "ProFile AI",
  },
  menu = [
    { title: "Home", url: "/" },
    {
      title: "Products",
      url: "#",
      items: [
        {
          title: "AI Resume Builder",
          description:
            "Generate a tailored, ATS-ready resume in under a minute.",
          icon: <Zap className="size-5 shrink-0" />,
          url: "/dashboard",
        },
        {
          title: "Cover Letters",
          description:
            "Pair every application with a polished, role-specific letter.",
          icon: <Book className="size-5 shrink-0" />,
          url: "/dashboard/cover-letters",
        },
        {
          title: "ATS Score",
          description:
            "See how your resume performs against real applicant systems.",
          icon: <Trees className="size-5 shrink-0" />,
          url: "/dashboard/ats",
        },
        {
          title: "Application Tracker",
          description:
            "Manage every opportunity from one calm, focused workspace.",
          icon: <Sunset className="size-5 shrink-0" />,
          url: "/dashboard/applications",
        },
      ],
    },
    {
      title: "Resources",
      url: "#",
      items: [
        {
          title: "Templates",
          description:
            "Hand-picked, recruiter-tested designs for every industry.",
          icon: <Zap className="size-5 shrink-0" />,
          url: "/templates",
        },
        {
          title: "Help Center",
          description: "Get all the answers you need right here.",
          icon: <Book className="size-5 shrink-0" />,
          url: "/help",
        },
        {
          title: "Pricing",
          description: "Simple plans for job seekers and teams.",
          icon: <Trees className="size-5 shrink-0" />,
          url: "/pricing",
        },
        {
          title: "Contact",
          description: "We are here to help you with any questions.",
          icon: <Sunset className="size-5 shrink-0" />,
          url: "/help",
        },
      ],
    },
    {
      title: "Pricing",
      url: "/pricing",
    },
    {
      title: "Blog",
      url: "/help",
    },
  ],
  auth = {
    login: { title: "Log in", url: "/login" },
    signup: { title: "Get Started Free", url: "/register" },
  },
  className,
}: Navbar1Props) => {
  return (
    <section
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand — left aligned, visible on every breakpoint */}
        <Link
          href={logo.url}
          aria-label="ProFile AI home"
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            ProFile <span className="text-gradient">AI</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden flex-1 items-center justify-center lg:flex">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              {menu.map((item) => renderMenuItem(item))}
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ModeToggleCompact />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-foreground"
          >
            <Link href={auth.login.url}>{auth.login.title}</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-lg border-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-fuchsia-400 hover:shadow-lg hover:shadow-violet-500/30"
          >
            <Link href={auth.signup.url}>{auth.signup.title}</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <ModeToggleCompact />
          <Button
            asChild
            size="sm"
            className="hidden rounded-lg border-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 text-sm font-semibold text-white shadow-md shadow-violet-500/25 sm:inline-flex"
          >
            <Link href={auth.signup.url}>
              {auth.signup.title}
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label="Open menu"
                variant="outline"
                size="icon"
                className="rounded-lg border-border/60"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  <Link href={logo.url} className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <span className="text-lg font-semibold tracking-tight">
                      ProFile <span className="text-gradient">AI</span>
                    </span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 p-4">
                <Accordion
                  type="single"
                  collapsible
                  className="flex w-full flex-col gap-4"
                >
                  {menu.map((item) => renderMobileMenuItem(item))}
                </Accordion>

                <div className="flex flex-col gap-3">
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-lg border-border/60"
                  >
                    <Link href={auth.login.url}>{auth.login.title}</Link>
                  </Button>
                  <Button
                    asChild
                    className="rounded-lg border-0 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/25"
                  >
                    <Link href={auth.signup.url}>{auth.signup.title}</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </section>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger className="rounded-lg bg-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-foreground data-[state=open]:bg-violet-500/10 data-[state=open]:text-foreground">
          {item.title}
        </NavigationMenuTrigger>
        <NavigationMenuContent className="border border-border/60 bg-popover/95 text-popover-foreground shadow-xl shadow-violet-500/5 backdrop-blur-xl">
          {item.items.map((subItem) => (
            <NavigationMenuLink asChild key={subItem.title} className="w-80">
              <SubMenuLink item={subItem} />
            </NavigationMenuLink>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        href={item.url}
        className="group inline-flex h-9 w-max items-center justify-center rounded-lg bg-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-foreground"
      >
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="mt-2">
          {item.items.map((subItem) => (
            <SubMenuLink key={subItem.title} item={subItem} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <Link
      key={item.title}
      href={item.url}
      className="text-md block py-2 font-semibold"
    >
      {item.title}
    </Link>
  );
};

const SubMenuLink = ({ item }: { item: MenuItem }) => {
  return (
    <Link
      className="group/sublink flex w-full min-w-0 flex-row gap-3 rounded-xl p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-fuchsia-500/10 hover:text-accent-foreground sm:min-w-80 sm:gap-4"
      href={item.url}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-600/15 to-fuchsia-500/15 text-violet-600 transition-colors group-hover/sublink:from-violet-600 group-hover/sublink:to-fuchsia-500 group-hover/sublink:text-white dark:text-violet-300">
        {item.icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{item.title}</div>
        {item.description && (
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
};

export { Navbar1 };
