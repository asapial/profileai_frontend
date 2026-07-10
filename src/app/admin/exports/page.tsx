import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const dynamic = "force-dynamic";

export default function AdminExportsPage() {
  return (
    <AdminComingSoon
      title="Exports"
      subtitle="Background-job console for user-data and resume/cover-letter PDF exports. Track queued, running, and completed jobs across all users."
      bullets={[
        {
          title: "Queue overview",
          body: "Live counts of pending, running, and failed jobs with retry actions.",
        },
        {
          title: "Audit trail",
          body: "Per-job metadata: initiator, target file, completion time, error log.",
        },
        {
          title: "Manual trigger",
          body: "Kick off an export on behalf of a user for support escalations.",
        },
      ]}
    />
  );
}