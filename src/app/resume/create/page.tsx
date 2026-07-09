// Compatibility redirect: the create-resume wizard actually lives at
// `/dashboard/resume/create` inside the `(user)` route group. Older
// links (and the in-app "New resume" buttons) point at the bare
// `/resume/create` path so we forward here to keep them working.

import { redirect } from "next/navigation";

export default async function ResumeCreateRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") sp.set(key, value);
    else if (Array.isArray(value) && value[0]) sp.set(key, value[0]);
  }
  const qs = sp.toString();
  redirect(`/dashboard/resume/create${qs ? `?${qs}` : ""}`);
}