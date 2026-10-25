"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Laptop,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthRequest = {
  id: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  fingerprint: string;
  status: "PENDING" | "APPROVED" | "DENIED" | "EXPIRED" | "USED";
  expiresAt: string;
  createdAt: string;
  canApprove: boolean;
};

function statusCopy(status: AuthRequest["status"]) {
  switch (status) {
    case "PENDING": return "Waiting for your decision";
    case "APPROVED": return "Device approved";
    case "DENIED": return "Device denied";
    case "EXPIRED": return "Request expired";
    case "USED": return "Device already connected";
  }
}

function AuthorizeInner() {
  const params = useSearchParams();
  const requestId = params.get("request") ?? "";
  const queryClient = useQueryClient();

  const request = useQuery({
    queryKey: ["worker-auth-request", requestId],
    queryFn: () => api.get<AuthRequest>(`/worker/auth/requests/${encodeURIComponent(requestId)}`),
    enabled: Boolean(requestId),
    refetchInterval: query => query.state.data?.status === "PENDING" ? 3_000 : false,
    retry: 1,
  });

  const decide = useMutation({
    mutationFn: (decision: "APPROVE" | "DENY") =>
      api.post<AuthRequest>(`/worker/auth/requests/${encodeURIComponent(requestId)}/decision`, { decision }),
    onSuccess: data => {
      toast.success(data.status === "APPROVED" ? "Device approved. Return to the desktop app." : "Request denied.");
      void queryClient.invalidateQueries({ queryKey: ["worker-auth-request", requestId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!requestId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14">
        <Card className="border-rose-500/25">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto size-8 text-rose-500" />
            <h1 className="mt-3 text-xl font-semibold tracking-tight">Missing authorization request</h1>
            <p className="mt-2 text-sm text-muted-foreground">Open the desktop app and choose “Continue in browser” again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (request.isLoading) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4">
        <div className="text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" /> Loading authorization request…</div>
      </div>
    );
  }

  if (request.isError) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14">
        <Card className="border-rose-500/25">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto size-8 text-rose-500" />
            <h1 className="mt-3 text-xl font-semibold tracking-tight">This request could not be loaded</h1>
            <p className="mt-2 text-sm text-muted-foreground">{(request.error as Error).message}</p>
            <p className="mt-2 text-xs text-muted-foreground">Return to the desktop app and start browser sign-in again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = request.data!;
  const decided = data.status !== "PENDING";
  const approved = data.status === "APPROVED" || data.status === "USED";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="mb-6">
        <p className="text-xs font-semibold text-primary">ProfileAI Worker</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.03em]">Authorize this Windows device</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Only approve a device you started yourself. This gives the desktop worker its own revocable key and session.
        </p>
      </div>

      <Card className={cn("overflow-hidden", approved && "border-emerald-500/30", data.status === "DENIED" && "border-rose-500/30")}>
        <CardContent className="p-0">
          <div className="flex items-start gap-4 border-b border-border/70 p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Laptop className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold tracking-tight">{data.deviceName}</h2>
                <span className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                  approved
                    ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                    : data.status === "DENIED" || data.status === "EXPIRED"
                      ? "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300"
                      : "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
                )}>
                  {statusCopy(data.status)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{data.platform} · app {data.appVersion} · requested {new Date(data.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <dl className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-muted/25 p-3">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Fingerprint className="size-3.5" /> Device key fingerprint</dt>
              <dd className="mt-1.5 break-all font-mono text-xs leading-5">{data.fingerprint}</dd>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/25 p-3">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><KeyRound className="size-3.5" /> Expires</dt>
              <dd className="mt-1.5 text-sm">{new Date(data.expiresAt).toLocaleString()}</dd>
            </div>
          </dl>

          <div className="border-t border-border/70 px-6 py-4">
            <div className="flex items-start gap-2 rounded-xl bg-primary/[.06] px-3 py-2.5 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                Approving lets this worker claim tasks you queue, open the dedicated browser, and return captured job details.
                Separately, browser search and scrolling need per-source permission before any task can use them.
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">
              {approved ? "You can close this tab and return to ProfileAI Worker." : decided ? "This request can no longer be approved." : "The desktop app is waiting for this decision."}
            </p>
            {approved ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-4" /> Connected</span>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" disabled={decided || decide.isPending} onClick={() => decide.mutate("DENY")}>
                  <X className="mr-2 size-4" /> Deny
                </Button>
                <Button disabled={decided || decide.isPending} onClick={() => decide.mutate("APPROVE")}>
                  {decide.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ShieldCheck className="mr-2 size-4" />}
                  Approve device
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WorkerAuthorizePage() {
  return (
    <Suspense fallback={<div className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 text-sm text-muted-foreground"><Loader2 className="mb-3 size-6 animate-spin" /> Loading…</div>}>
      <AuthorizeInner />
    </Suspense>
  );
}
