"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminInvoices } from "@/lib/hooks/useAdminInvoices";
import { useAdminPlans } from "@/lib/hooks/useAdminPlans";

export default function AdminBillingPage() {
  const plans = useAdminPlans();
  const invoices = useAdminInvoices();
  const paid = (invoices.data ?? []).filter((invoice) => invoice.status === "PAID");
  const revenue = paid.reduce((total, invoice) => total + invoice.amount, 0);
  const values = [
    ["Active plans", (plans.data ?? []).filter((plan) => !plan.isArchived).length],
    ["Invoices", invoices.data?.length ?? 0],
    ["Paid revenue", new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(revenue)],
    ["Active subscribers", (plans.data ?? []).reduce((total, plan) => total + plan.activeSubscribers, 0)],
  ];
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Billing operations</h1><p className="text-sm text-muted-foreground">Live plan, subscription and invoice indicators from the billing database.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {values.map(([label, value]) => <Card key={String(label)}><CardContent className="p-5"><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}
      </div>
      <Card><CardHeader><CardTitle className="text-base">Plan health</CardTitle></CardHeader><CardContent className="space-y-3">{plans.data?.map((plan) => <div key={plan.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{plan.name}</span><span className="text-muted-foreground">{plan.activeSubscribers} subscribers</span></div>)}</CardContent></Card>
    </div>
  );
}
