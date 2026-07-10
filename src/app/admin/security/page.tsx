import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const dynamic = "force-dynamic";

export default function AdminSecurityPage() {
  return (
    <AdminComingSoon
      title="Security"
      subtitle="Platform-wide security posture: suspicious login spikes, 2FA enforcement, and forced session resets."
      bullets={[
        {
          title: "Login anomalies",
          body: "Geographic outliers, impossible travel, and brute-force patterns.",
        },
        {
          title: "2FA enforcement",
          body: "Mandate 2FA for admins and roll it out to specific user cohorts.",
        },
        {
          title: "Session control",
          body: "Force sign-out across all sessions or per-device.",
        },
      ]}
    />
  );
}