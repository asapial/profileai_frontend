"use client";

import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CreditCard, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import { logout } from "@/lib/auth";



export function AccountTab() {
  return (
    <div className="space-y-6">
      <BillingSection />
      <DangerSection />
    </div>
  );
}

function BillingSection() {
  const { data, isLoading } = useDashboardSummary();

  // Limits surface the "plan" tier — dashboard summary already includes resumeLimit/apiLimit.
  const plan = "FREE";
  const status = "ACTIVE";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-violet-500" />
          Billing & plan
        </CardTitle>
        <CardDescription>
          {isLoading
            ? "Loading…"
            : `${data?.limits.resumeLimit ?? 0} resumes / mo · ${data?.limits.apiLimit ?? 0} AI credits / mo`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <p className="text-sm font-semibold">{plan}</p>
            <p className="text-xs text-muted-foreground">
              Status: {status}
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <a href="/pricing">
              Manage plan
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Tile label="Resumes used" value={data?.limits.resumeUsed ?? 0} />
          <Tile label="AI credits used" value={data?.limits.apiUsed ?? 0} />
          <Tile
            label="Resets"
            value={
              data?.limits.resetAt
                ? new Date(data.limits.resetAt).toLocaleDateString()
                : "—"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function DangerSection() {
  const router = useRouter();
  const signOut = async () => {
    await logout();
    toast.success("Signed out");
    router.push("/login");
  };
  return (
    <Card className="border-rose-500/30">
      <CardHeader>
        <CardTitle className="text-rose-600">Sign out</CardTitle>
        <CardDescription>
          End your session on this device. Other devices stay signed in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={signOut}>
          Sign out everywhere
        </Button>
      </CardContent>
    </Card>
  );
}