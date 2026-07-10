import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const dynamic = "force-dynamic";

export default function AdminTemplatesPage() {
  return (
    <AdminComingSoon
      title="Template gallery"
      subtitle="Curate the public resume template library, retire underperformers, and ship seasonal picks without redeploying the app."
      bullets={[
        {
          title: "CRUD",
          body: "Create, edit, archive, and reorder templates with version history.",
        },
        {
          title: "Category rotation",
          body: "Promote or demote templates across Modern / Classic / Creative / ATS.",
        },
        {
          title: "Featured picks",
          body: "Pin a template to the home gallery or feature it for a date window.",
        },
      ]}
    />
  );
}