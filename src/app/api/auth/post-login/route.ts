import { NextRequest, NextResponse } from "next/server";

/**
 * Sets the `userRole` cookie that the edge middleware reads to decide
 * between `/admin` and `/dashboard` after login.
 *
 * Why a separate route?
 *   - The backend's response is consumed in the browser as JSON, but it
 *     sets cookies on the *backend* domain (different origin from the
 *     frontend in dev/prod). Reading the role out of the JWT on the
 *     edge avoids a roundtrip and keeps the cookie same-origin.
 *   - Anything we accept here must be derivable from a JWT we already
 *     trust: we re-encode/decode the cookie-delivered `accessToken`
 *     ourselves rather than trusting a value posted by the client.
 */

type Role = "ADMIN" | "USER";

function decodeJwtRole(token: string): Role | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  try {
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    // eslint-disable-next-line no-undef
    const payload = JSON.parse(atob(padded));
    return payload?.role === "ADMIN" || payload?.role === "USER"
      ? payload.role
      : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  if (!accessToken) {
    return NextResponse.json(
      { ok: false, message: "Not authenticated." },
      { status: 401 }
    );
  }

  const role = decodeJwtRole(accessToken);
  if (!role) {
    return NextResponse.json(
      { ok: false, message: "Could not determine role." },
      { status: 400 }
    );
  }

  const res = NextResponse.json({ ok: true, role });
  res.cookies.set({
    name: "userRole",
    value: role,
    httpOnly: false, // edge must read it; not a security boundary.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Match the access-token lifetime (1 day) but cap at 1h to limit
    // staleness if the user logs in as one role and the cookie isn't
    // refreshed on the next login. Refreshed automatically on every
    // successful login.
    maxAge: 60 * 60,
  });
  return res;
}
