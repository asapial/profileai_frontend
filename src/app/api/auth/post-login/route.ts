import { NextRequest, NextResponse } from "next/server";

/**
 * Copies a freshly issued access token into same-origin, httpOnly frontend
 * cookies after asking the backend to validate it.
 *
 * Why a separate route?
 *   - Cookies set by the backend are scoped to the backend host. They are
 *     therefore invisible to the frontend's edge proxy when the two apps
 *     use different hosts.
 *   - The login endpoints already return the short-lived access token in
 *     their JSON response. We validate that token through `/auth/me` before
 *     copying it into a frontend-host cookie; decoded JWT claims alone are
 *     never treated as proof of authentication here.
 */

type Role = "ADMIN" | "USER";

type PostLoginBody = { accessToken?: unknown };
type MeResponse = { data?: { user?: { role?: unknown } } };

const ACCESS_TOKEN_MAX_AGE_SECONDS = 12 * 60 * 60;

function decodeJwtRole(token: string): Role | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  try {
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return payload?.role === "ADMIN" || payload?.role === "USER"
      ? payload.role
      : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let body: PostLoginBody;
  try {
    body = (await request.json()) as PostLoginBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 }
    );
  }

  const accessToken =
    typeof body.accessToken === "string" ? body.accessToken.trim() : "";
  if (!accessToken || accessToken.length > 8192) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated." },
      { status: 401 }
    );
  }

  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1"
  ).replace(/\/+$/, "");

  let verifiedRole: Role | null = null;
  try {
    const verification = await fetch(`${apiBaseUrl}/auth/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (verification.ok) {
      const payload = (await verification.json()) as MeResponse;
      const role = payload.data?.user?.role;
      if (role === "ADMIN" || role === "USER") verifiedRole = role;
    }
  } catch {
    return NextResponse.json(
      { ok: false, message: "Session verification is temporarily unavailable." },
      { status: 503 }
    );
  }

  const tokenRole = decodeJwtRole(accessToken);
  if (!verifiedRole || tokenRole !== verifiedRole) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true, role: verifiedRole });
  res.cookies.set({
    name: "accessToken",
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
  res.cookies.set({
    name: "userRole",
    value: verifiedRole,
    httpOnly: false, // edge must read it; not a security boundary.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Match the authenticated session lifetime. This marker is only a UX
    // hint; the signed JWT remains the authorization source of truth.
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
  res.headers.set("Cache-Control", "private, no-store, max-age=0");
  return res;
}
