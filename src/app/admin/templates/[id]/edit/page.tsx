// A-P7 server wrapper for template editor. Uses Next.js 15
// `Promise<params>` pattern for the dynamic `[id]` segment.

import { AdminTemplateEditClient } from "./_views/AdminTemplateEditClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit template · Admin" };

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  return <AdminTemplateEditClient id={id} />;
}