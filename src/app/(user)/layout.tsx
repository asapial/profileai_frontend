import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard/DashboardShell";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth — the edge middleware already gates these routes by
  // the `accessToken` cookie. If a request reaches us without that cookie
  // the middleware would have redirected, so reaching here already means
  // there's a session. We still call /auth/me for SSR-friendly user data
  // and to gracefully redirect ADMINs into the admin shell.
  //
  // IMPORTANT: do NOT redirect to /login when /auth/me fails. The cookie
  // is present at this point; a transient backend error shouldn't log the
  // user out mid-session. The middleware will keep them out if the cookie
  // actually goes missing.
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (accessToken) {
    const user = await getCurrentUser();
    if (user && user.role === "ADMIN") {
      redirect("/admin");
    }
  }
  return <DashboardShell>{children}</DashboardShell>;
}
