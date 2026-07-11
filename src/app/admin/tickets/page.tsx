// A-P11 server wrapper for support tickets.

import { AdminTicketsClient } from "./_views/AdminTicketsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tickets · Admin" };

export default function Page() {
  return <AdminTicketsClient />;
}