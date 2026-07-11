import { AdminAnnouncementsClient } from "./_views/AdminAnnouncementsClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Announcements · Admin",
};

export default function AdminAnnouncementsPage() {
  return <AdminAnnouncementsClient />;
}
