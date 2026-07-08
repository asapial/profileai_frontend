import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard/DashboardShell";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }
  if (user.role === "ADMIN") {
    redirect("/admin");
  }
  return <DashboardShell>{children}</DashboardShell>;
}
