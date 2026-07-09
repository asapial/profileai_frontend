import { NextRequest, NextResponse } from "next/server";

/**
 * Edge proxy that gates protected routes.
 *
 * Next.js 16 supports a `proxy.ts` file as an alternative to
 * `middleware.ts` at the same locations (project root or `src/`).
 * Only one of them may exist — Next.js will pick whichever it finds
 * and ignore the other. We use `proxy.ts` here per project convention.
 *
 * Design notes:
 *
 * 1. The backend's only reliable auth signal is the `accessToken` cookie,
 *    which is `httpOnly`. The `userRole` cookie below is written by our
 *    server-side `/api/auth/post-login` route AFTER a real backend login,
 *    so the value is always tied to a verified session. We never accept a
 *    `userRole` value posted from the client.
 *
 * 2. Role is kept as a non-httpOnly, lax cookie purely so the edge can
 *    authorize without re-decoding the JWT on every navigation. It is not
 *    a security boundary — any real authorization still happens server-side
 *    inside `/api/v1/*`. The cookie is `SameSite=Lax`, scoped to `/`, and
 *    never accepts values written from arbitrary origins.
 *
 * 3. We also fall back to decoding the JWT payload from the accessToken
 *    cookie, so a user who logged in before this proxy shipped (or whose
 *    `userRole` cookie has expired) still gets the correct redirect.
 */

type Role = "ADMIN" | "USER";

const ACCESS_TOKEN_COOKIE = "accessToken";
const ROLE_COOKIE = "userRole";

// Routes that should never be reachable while logged in.
const AUTH_ROUTES: readonly string[] = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

// Admin-only sections.
const ADMIN_PREFIXES: readonly string[] = ["/admin"];

// User-only sections (everything inside the `(user)` route group, plus
// their concrete sub-routes). The matcher in `config` only fires for
// these prefixes, but we keep an explicit allowlist here as defense in
// depth in case the matcher is later widened.
const USER_PREFIXES: readonly string[] = [
  "/dashboard",
  "/profile",
  "/resumes",
  "/resume",
  "/templates",
];

const PROTECTED_PREFIXES: readonly string[] = [
  ...ADMIN_PREFIXES,
  ...USER_PREFIXES,
];

/**
 * Base64url → JSON without pulling in Buffer / atob polyfill edge cases.
 * Returns null on any parse failure so we safely fall back to "no role".
 */
function decodeJwtPayload(token: string): { role?: Role } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  try {
    // atob is available in the edge runtime; pad to multiple of 4 first.
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Defends against open-redirect: only allow same-origin paths that start
 * with a single "/" and don't contain "//" or a protocol-relative prefix.
 */
function safeRedirectPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("\n") || raw.includes("\r")) return null;
  return raw;
}

function isAuthRoute(pathname: string): boolean {
  // `/login/2fa` is part of the login flow and should also redirect when
  // the user is already authenticated.
  return (
    AUTH_ROUTES.includes(pathname) ||
    pathname === "/login/2fa" ||
    pathname.startsWith("/login/")
  );
}

function matchesAny(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const roleCookie = request.cookies.get(ROLE_COOKIE)?.value as Role | undefined;
  const isAuthenticated = Boolean(accessToken);

  // ─── 1. Authenticated user hitting an auth page → bounce to their home ─
  if (isAuthenticated && isAuthRoute(pathname)) {
    const target = roleCookie === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // ─── 2. Admin routes require ADMIN role ───────────────────────────────
  if (matchesAny(pathname, ADMIN_PREFIXES)) {
    if (!isAuthenticated) {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    // Prefer the server-set role cookie. Fall back to decoding the JWT so
    // a user who logged in before this proxy shipped still works.
    const role: Role | undefined =
      roleCookie ?? decodeJwtPayload(accessToken!)?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ─── 3. User-area routes require any authenticated user ────────────────
  if (matchesAny(pathname, USER_PREFIXES)) {
    if (!isAuthenticated) {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ─── 4. Honour ?redirect= for any other guarded entry point ───────────
  if (
    isAuthenticated &&
    matchesAny(pathname, PROTECTED_PREFIXES) === false &&
    searchParams.has("redirect")
  ) {
    const target = safeRedirectPath(searchParams.get("redirect"));
    if (target) {
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Only run on guarded paths. Public marketing/auth pages stay out of the
 * middleware pipeline entirely — keeps the edge work minimal.
 */
export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/resumes/:path*",
    "/resume/:path*",
    "/templates/:path*",
    "/login",
    "/login/:path*",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
};
