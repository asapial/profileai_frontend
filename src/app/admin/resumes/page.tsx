import { AdminComingSoon } from "@/components/admin/AdminComingSoon";

export const dynamic = "force-dynamic";

export default function AdminResumesPage() {
  return (
    <AdminComingSoon
      title="Resume library"
      subtitle="Cross-account view of every resume created on the platform. Use it to moderate content, audit template usage, and trace abuse."
      bullets={[
        {
          title: "Global search",
          body: "Filter by owner, template, status, ATS score, and creation window.",
        },
        {
          title: "Bulk moderation",
          body: "Hide, soft-delete, or reassign resumes across many users at once.",
        },
        {
          title: "Template analytics",
          body: "See which templates drive the most exports and the highest ATS scores.",
        },
      ]}
    />
  );
}