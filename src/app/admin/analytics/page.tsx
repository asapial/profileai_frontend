import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const dynamic = "force-dynamic";

export default function AdminAnalyticsPage() {
  return (
    <AdminComingSoon
      title="Analytics"
      subtitle="Platform-wide charts for user growth, resume volume, ATS distribution, and revenue. Drill into any cohort with a date picker."
      bullets={[
        {
          title: "Growth & retention",
          body: "Daily, weekly, and monthly user signups with cohort retention overlays.",
        },
        {
          title: "Resume health",
          body: "ATS score distribution, export success rate, and template mix.",
        },
        {
          title: "Revenue",
          body: "MRR, ARPU, plan upgrades, and trial-to-paid conversion.",
        },
      ]}
    />
  );
}