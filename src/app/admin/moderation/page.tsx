// A-P10 server wrapper for content moderation queue.

import { AdminModerationClient } from "./_views/AdminModerationClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderation · Admin" };

export default function Page() {
  return <AdminModerationClient />;
}