import { NextResponse } from "next/server";

/**
 * Clears the frontend-issued `userRole` cookie.
 *
 * The backend's logout endpoint already clears `accessToken` / `refreshToken`,
 * but it can't touch a cookie on a different origin. Call this after a
 * successful logout so the edge middleware immediately treats the browser
 * as anonymous (no `redirect` loop back to /admin).
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: "userRole",
    value: "",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
