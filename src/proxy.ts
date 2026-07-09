import { NextRequest, NextResponse } from "next/server";

/* ──────────────────────────────────────────────────────────────────────────
 * Edge proxy (Next.js 16 `proxy.ts` — replaces `middleware.ts`).
 *
 * Scope
 * -----
 * Gate protected pages at the edge so unauthenticated users never see
 * protected chrome. Auth pages (`/login`, `/register`, `/forgot-password`,
 * etc.) render unconditionally so users can always re-authenticate or
 * switch accounts. The proxy NEVER authorizes a request by itself —
 * every protected API route is still verified server-side.
 *
 * Trust model
 * -----------
 * • `accessToken`  — set by the backend as `httpOnly`. The only signal we
 *                    trust for "is this user signed in?". Cannot be read
 *                    by client JS, so any value we see on the edge is
 *                    genuine.
 * • `userRole`     — non-httpOnly, set by `/api/auth/post-login` after a
 *                    real backend login, cleared by `/api/auth/post-logout`.
 *                    UX hint only; missing value falls back to decoding
 *                    the `accessToken` payload (also not a security gate).
 *
 * Anything the client posts to us is ignored — the post-login route
 * derives the role from the cookie-delivered `accessToken` itself.
 *
 * Limits of this file
 * -------------------
 * • We do NOT verify JWT signatures on the edge (no key material here).
 *   Authorization always re-checks on the backend inside `/api/v1/*`.
 * • Public pages, static assets, `/_next/*`, and our own `/api/*`
 *   routes are excluded by `config.matcher` so this file never runs.
 * ────────────────────────────────────────────────────────────────────────*/

/* ----------------------------- Constants ---------------------------------*/

/**
 * Authenticated-session cookie names. Kept in one place so the proxy,
 * `lib/auth.ts`, and the `api/auth/post-login|logout` routes all agree.
 */
export const COOKIE_NAMES = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  userRole: "userRole",
} as const;

/**
 * Role values mirrored from the backend. We keep them as a literal union
 * (not an `enum`) so the edge bundle stays tiny and tree-shakeable.
 */
export const ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Authentication-only routes. We deliberately do NOT auto-bounce a
 * signed-in user away from these pages — users routinely need to log in
 * as a different identity, re-log-in after clearing cookies, or just
 * visit `/login` directly. The login form's submit handler already
 * navigates to the correct home route after a successful login, so
 * allowing the page to render is harmless and matches industry-standard
 * UX (GitHub, Google, etc. show a "you're already signed in" prompt
 * instead of a hard redirect).
 *
 * Kept here so the policy in `decide()` has an authoritative list of
 * "paths that should NEVER be gated by an auth check".
 */
const AUTH_ROUTES = new Set<string>([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

/**
 * Per-role home route. Exported so the post-login route in `lib/auth.ts`
 * can stay in lock-step with this map.
 */
export const HOME_ROUTE_BY_ROLE: Record<Role, string> = {
  ADMIN: "/admin",
  USER: "/dashboard",
};

/* ----------------------------- Helpers -----------------------------------*/

/**
 * Decode a base64url JWT payload. Edge runtime has `atob` and `JSON.parse`
 * available natively. We never verify the signature here — we only use the
 * payload as a UX hint when the `userRole` cookie is missing.
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

/**
 * Resolve the effective role from cookies (and JWT fallback). Returns
 * `null` if no role can be determined — the caller decides what to do.
 */
function resolveRole(request: NextRequest): Role | null {
  const cookieRole = request.cookies.get(COOKIE_NAMES.userRole)?.value;
  if (cookieRole === ROLES.ADMIN || cookieRole === ROLES.USER) {
    return cookieRole;
  }

  const token = request.cookies.get(COOKIE_NAMES.accessToken)?.value;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  return payload?.role === ROLES.ADMIN || payload?.role === ROLES.USER
    ? payload.role
    : null;
}

/**
 * `pathname` matches if it's exactly `prefix` or a descendant of it.
 * Centralized so we never accidentally use `startsWith("/admin")` and
 * match `/administrator` too.
 */
function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Open-redirect guard for `?redirect=…`. Exported so the login/2FA forms
 * can validate identically and stay in sync.
 *
 * Rules:
 *   • Must start with a single `/`
 *   • Must NOT start with `//` (protocol-relative)
 *   • Must NOT contain CR/LF (header injection)
 */
export function safeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.length > 512) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (/[\r\n\0]/.test(raw)) return null;
  return raw;
}

/**
 * Build a redirect URL that preserves the incoming search + hash, so
 * `/dashboard?tab=2#section` survives a gate bounce intact.
 */
function redirectTo(
  request: NextRequest,
  pathname: string,
  init?: { query?: Record<string, string> }
): NextResponse {
  const url = new URL(pathname, request.url);
  url.search = request.nextUrl.search;
  url.hash = request.nextUrl.hash;

  if (init?.query) {
    for (const [key, value] of Object.entries(init.query)) {
      url.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(url);
}

/**
 * Add a per-request correlation ID to the response so we can correlate
 * edge decisions with backend logs. Cheap, deterministic, no PII.
 */
function withTraceHeader(response: NextResponse, requestId: string): NextResponse {
  response.headers.set("x-proxy-request-id", requestId);
  return response;
}

/* ----------------------------- Policy ------------------------------------*/

/**
 * Decision table for each protected route family. Each branch returns the
 * final `NextResponse` (either a redirect or `NextResponse.next()`).
 *
 * Kept as a single function so the policy is reviewable in one place.
 */
function decide(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get(COOKIE_NAMES.accessToken)?.value;
  const isAuthenticated = Boolean(accessToken);

  // 1. Admin area — requires ADMIN. Falls through to /dashboard on a
  //    non-admin session so we never bounce a logged-in user to /login.
  if (matchesPrefix(pathname, "/admin")) {
    if (!isAuthenticated) {
      return redirectTo(request, "/login", { query: { redirect: pathname } });
    }
    return resolveRole(request) === ROLES.ADMIN
      ? NextResponse.next()
      : redirectTo(request, HOME_ROUTE_BY_ROLE.USER);
  }

  // 2. User area — requires any authenticated session.
  if (
    matchesPrefix(pathname, "/dashboard") ||
    matchesPrefix(pathname, "/profile") ||
    matchesPrefix(pathname, "/resumes") ||
    matchesPrefix(pathname, "/resume") ||
    matchesPrefix(pathname, "/templates")
  ) {
    if (!isAuthenticated) {
      return redirectTo(request, "/login", { query: { redirect: pathname } });
    }
    return NextResponse.next();
  }

  // 3. Auth pages (`/login`, `/register`, `/forgot-password`, etc.) render
  //    unconditionally — see `AUTH_ROUTES` for the rationale. We do not
  //    bounce signed-in users away; the login form handles post-login
  //    navigation on its own.

  // 4. Everything else (public pages, /api, /_next, static assets) is
  //    intentionally NOT matched by `config.matcher` so we never get here.
  //    Returning `next()` is a defensive default.
  return NextResponse.next();
}

/* ----------------------------- Entry point -------------------------------*/

export function proxy(request: NextRequest): NextResponse {
  const response = decide(request);
  // Light-touch correlation header on every decision (redirect or pass).
  const requestId =
    request.headers.get("x-request-id") ??
    crypto.randomUUID();
  return withTraceHeader(response, requestId);
}

/* ----------------------------- Matcher -----------------------------------*/

/**
 * The matcher is the SINGLE source of truth for which paths the edge runs
 * on. Keep it tight: public pages, `/_next/*`, `/api/*`, and static
 * assets stay out of the pipeline.
 *
 * The policy in `decide()` uses the same prefix list internally, but the
 * matcher prevents the proxy from being invoked at all for non-guarded
 * paths — that's the real performance boundary.
 */
export const config = {
  matcher: [
    // Admin
    "/admin",
    "/admin/:path*",

    // User
    "/dashboard",
    "/dashboard/:path*",
    "/profile",
    "/profile/:path*",
    "/resumes",
    "/resumes/:path*",
    "/resume",
    "/resume/:path*",
    "/templates",
    "/templates/:path*",

    // Auth pages — proxy still runs so it can stamp x-proxy-request-id
    // and so future policy changes can hook in without touching the
    // matcher. Pages themselves render unconditionally.
    "/login",
    "/login/:path*",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
};
