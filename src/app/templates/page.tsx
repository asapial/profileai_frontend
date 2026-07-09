// Compatibility redirect: the template gallery lives at
// `/dashboard/templates` inside the `(user)` route group. Bare
// `/templates` links are forwarded here.

import { redirect } from "next/navigation";

export default async function TemplatesRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") sp.set(key, value);
    else if (Array.isArray(value) && value[0]) sp.set(key, value[0]);
  }
  const qs = sp.toString();
  redirect(`/dashboard/templates${qs ? `?${qs}` : ""}`);
}