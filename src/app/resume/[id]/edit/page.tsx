// Compatibility redirect: the resume editor lives at
// `/dashboard/resume/[id]/edit` inside the `(user)` route group.
// Bare `/resume/:id/edit` links are forwarded here.

import { redirect } from "next/navigation";

export default async function ResumeEditRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const raw = await searchParams;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") sp.set(key, value);
    else if (Array.isArray(value) && value[0]) sp.set(key, value[0]);
  }
  const qs = sp.toString();
  redirect(`/dashboard/resume/${id}/edit${qs ? `?${qs}` : ""}`);
}