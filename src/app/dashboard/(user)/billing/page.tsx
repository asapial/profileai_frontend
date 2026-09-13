"use client";
import { PageFeedback } from "@/components/dashboard/PageFeedback";

import { Check, CreditCard, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useBillingPortal,
  useCheckout,
  useCurrentSubscription,
  useInvoices,
  usePlans,
} from "@/lib/hooks/useBilling";

export default function BillingPage() {
  const plans = usePlans();
  const current = useCurrentSubscription();
  const invoices = useInvoices();
  const checkout = useCheckout();
  const portal = useBillingPortal();

  if (plans.isLoading || current.isLoading || invoices.isLoading)
    return (
      <div className="p-6">
        <PageFeedback loading />
      </div>
    );
  if (plans.isError || current.isError || invoices.isError)
    return (
      <div className="p-6">
        <PageFeedback
          error
          onRetry={() => {
            void plans.refetch();
            void current.refetch();
            void invoices.refetch();
          }}
        />
      </div>
    );
  const open = async (action: () => Promise<{ url: string }>) => {
    try {
      const result = await action();
      window.location.assign(result.url);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Billing action failed",
      );
    }
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Your plan, payment details and invoice history.
          </p>
        </div>
        {current.data?.subscription && (
          <Button
            variant="outline"
            disabled={portal.isPending}
            onClick={() => open(() => portal.mutateAsync())}
          >
            <CreditCard className="mr-2 size-4" />
            Manage billing
          </Button>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {(plans.data ?? []).map((plan) => {
          const active = current.data?.plan?.slug === plan.slug;
          return (
            <Card key={plan.id} className={active ? "border-violet-500" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {active && <Badge>Current</Badge>}
                </div>
                <p className="text-3xl font-semibold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: plan.currency,
                  }).format(plan.amount / 100)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li
                      key={String(
                        typeof feature === "string"
                          ? feature
                          : JSON.stringify(feature),
                      )}
                      className="flex gap-2"
                    >
                      <Check className="mt-0.5 size-4 text-emerald-600" />
                      <span>
                        {typeof feature === "string"
                          ? feature
                          : String((feature as { label?: string }).label ?? "")}
                      </span>
                    </li>
                  ))}
                </ul>
                {!active && plan.amount > 0 && (
                  <Button
                    className="w-full"
                    disabled={checkout.isPending}
                    onClick={() =>
                      open(() => checkout.mutateAsync({ planSlug: plan.slug }))
                    }
                  >
                    Choose {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(invoices.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            invoices.data?.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{invoice.stripeInvoiceId}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(invoice.issuedAt).toLocaleDateString()} ·{" "}
                    {invoice.status}
                  </p>
                </div>
                {invoice.hostedInvoiceUrl && (
                  <Button asChild size="sm" variant="ghost">
                    <a
                      aria-label="Open invoice"
                      href={invoice.hostedInvoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
