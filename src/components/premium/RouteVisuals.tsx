"use client";

import { usePathname } from "next/navigation";

import { PremiumBackground } from "./PremiumBackground";

const AUTH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/forget-password",
  "/reset-password",
  "/verify-email",
];

const PUBLIC_PREFIXES = [
  "/templates",
  "/pricing",
  "/howitworks",
  "/help",
  "/contact",
  "/privacy",
  "/terms",
];

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function RouteVisuals() {
  const pathname = usePathname() || "/";
  const decorative =
    pathname === "/" ||
    matches(pathname, "/dashboard/career") ||
    AUTH_PREFIXES.some((prefix) => matches(pathname, prefix)) ||
    PUBLIC_PREFIXES.some((prefix) => matches(pathname, prefix));

  return decorative ? <PremiumBackground /> : null;
}

