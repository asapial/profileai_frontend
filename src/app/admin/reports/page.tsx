import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const dynamic = "force-dynamic";

export default function AdminReportsPage() {
  return (
    <AdminComingSoon
      title="Reports"
      subtitle="Pre-canned operational reports — abuse, billing exceptions, dormant accounts, and template churn."
      bullets={[
        {
          title: "Abuse queue",
          body: "Reports flagged by the community moderation pipeline.",
        },
        {
          title: "Billing exceptions",
          body: "Failed payments, chargebacks, and pending refunds.",
        },
        {
          title: "Dormant users",
          body: "Accounts that signed up but never created a resume.",
        },
      ]}
    />
  );
}