import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const dynamic = "force-dynamic";

export default function AdminAuditLogPage() {
  return (
    <AdminComingSoon
      title="Audit log"
      subtitle="Immutable record of every admin action — role changes, status flips, settings edits, and bulk operations. Filterable by actor, target, and date."
      bullets={[
        {
          title: "Per-action trace",
          body: "Before / after diffs with timestamps and the admin who acted.",
        },
        {
          title: "Export",
          body: "Stream the log to CSV for compliance reviews.",
        },
      ]}
    />
  );
}