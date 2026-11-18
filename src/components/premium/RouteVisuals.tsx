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
  // These pages own their physical rooms. Mounting the older ambient scene
  // behind an opaque page wastes rendering work and mixes two art directions.
  if (["/templates", "/pricing", "/howitworks", "/help", "/privacy", "/terms", "/contact", "/help/cancel-or-refund", "/login", "/register", "/forgot-password", "/verify-email", "/reset-password"].includes(pathname)) return null;
  const decorative =
    matches(pathname, "/dashboard") ||
    matches(pathname, "/admin") ||
    AUTH_PREFIXES.some((prefix) => matches(pathname, prefix)) ||
    PUBLIC_PREFIXES.some((prefix) => matches(pathname, prefix));

  return decorative ? <PremiumBackground /> : null;
}

