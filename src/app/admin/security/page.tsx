import { AdminSecurityClient } from "./_views/AdminSecurityClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Security · Admin",
};

export default function AdminSecurityPage() {
  return <AdminSecurityClient />;
}
