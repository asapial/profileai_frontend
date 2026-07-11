// A-P12 server wrapper for help-article management.

import { AdminHelpArticlesClient } from "./_views/AdminHelpArticlesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Help articles · Admin" };

export default function Page() {
  return <AdminHelpArticlesClient />;
}