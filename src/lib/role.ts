// Server-side role resolution used by App Router layouts.
//
// Mirrors the policy in `src/proxy.ts` (the edge proxy already enforces
// auth + role at the edge, so by the time a server layout runs we can
// trust these cookies as a UX hint). The backend is still the only
// authority for authorization — this helper exists so layouts can render
// the correct shell without a client round-trip.

import { cookies } from "next/headers";
import type { Role } from "@/types";

export const ROLE_COOKIE = "userRole";
export const ACCESS_TOKEN_COOKIE = "accessToken";

/**
 * Decode a base64url JWT payload. We never verify the signature here —
 * the edge proxy has already done that for protected routes, and the
 * backend re-verifies on every API call. We only use the payload to
 * recover a missing/cleared `userRole` cookie.
 */
function decodeJwtPayload(token: string): { role?: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);

  try {
    const json = atob(padded);
    const payload = JSON.parse(json) as { role?: unknown };
    return { role: typeof payload.role === "string" ? payload.role : undefined };
  } catch {
    return null;
  }
}

function isRole(value: string | undefined): value is Role {
  return value === "USER" || value === "ADMIN";
}

/**
 * Read the effective role from the request cookies. Returns `null` when
 * neither the `userRole` cookie nor a decodable JWT is present — the
 * caller decides whether to redirect, render a default, or 404.
 *
 * Safe to call from any Server Component / layout.
 */
export async function getRoleFromCookies(): Promise<Role | null> {
  const store = await cookies();

  const cookieRole = store.get(ROLE_COOKIE)?.value;
  if (isRole(cookieRole)) return cookieRole;

  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  return isRole(payload?.role) ? payload.role : null;
}
