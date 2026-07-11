// A-P6 server wrapper for template creation.

import { AdminTemplateCreateClient } from "./_views/AdminTemplateCreateClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create template · Admin" };

export default function Page() {
  return <AdminTemplateCreateClient />;
}