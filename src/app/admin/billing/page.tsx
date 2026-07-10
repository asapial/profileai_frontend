import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const dynamic = "force-dynamic";

export default function AdminBillingPage() {
  return (
    <AdminComingSoon
      title="Billing"
      subtitle="Subscriptions, invoices, coupons, and refunds across the entire platform."
      bullets={[
        {
          title: "Subscriptions",
          body: "View MRR, churn, plan upgrades/downgrades, and trial conversion.",
        },
        {
          title: "Invoices",
          body: "Paid, open, past-due, and refunded invoices with one-click reissue.",
        },
        {
          title: "Coupons",
          body: "Create, retire, and audit promotional codes.",
        },
      ]}
    />
  );
}