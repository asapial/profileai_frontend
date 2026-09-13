import { NextResponse } from "next/server";

/**
 * Clears every auth cookie visible to the frontend origin.
 *
 * The backend's logout endpoint already clears `accessToken` / `refreshToken`,
 * but it can't touch a cookie on a different origin. Call this after a
 * successful logout so the proxy immediately treats the browser as anonymous,
 * even if a backend-domain cookie could not be cleared cross-origin.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  for (const name of ["accessToken", "refreshToken", "userRole"] as const) {
    res.cookies.set({
      name,
      value: "",
      httpOnly: name !== "userRole",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  res.headers.set("Cache-Control", "no-store");
  return res;
}
