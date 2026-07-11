import { AdminInvoicesClient } from "./_views/AdminInvoicesClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Invoices · Admin",
};

export default function AdminInvoicesPage() {
  return <AdminInvoicesClient />;
}
