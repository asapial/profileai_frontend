import { AdminAuditLogClient } from "./_views/AdminAuditLogClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Audit log · Admin",
};

export default function AdminAuditLogPage() {
  return <AdminAuditLogClient />;
}
