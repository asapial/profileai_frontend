"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type Consent = {
  source: string;
  name: string;
  level: "A" | "B" | "C";
  domains: string[];
  searchCapability: boolean;
  scrollCapability: boolean;
  captureCapability: boolean;
  maxPagesLimit: number;
  search: boolean;
  scroll: boolean;
  capture: boolean;
  maxPages: number;
  acknowledgedRisk: boolean;
  grantedAt: string | null;
  updatedAt: string | null;
  revokedAt: string | null;
};

type ConsentPayload = {
  search: boolean;
  scroll: boolean;
  capture: boolean;
  maxPages: number;
  acknowledgedRisk: boolean;
};

export function WorkerConsentPanel({ consents }: { consents: Consent[] }) {
  const queryClient = useQueryClient();
  const [acknowledged, setAcknowledged] = useState(false);

  const save = useMutation({
    mutationFn: ({ source, payload }: { source: string; payload: ConsentPayload }) =>
      api.put<Consent>(`/worker/consents/${encodeURIComponent(source)}`, payload),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.payload.search || variables.payload.scroll || variables.payload.capture
          ? `${variables.source.replaceAll("_", " ")} permission saved.`
          : `${variables.source.replaceAll("_", " ")} browser permission removed.`,
      );
      return queryClient.invalidateQueries({ queryKey: ["worker-overview"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = (row: Consent, patch: Partial<ConsentPayload>) => {
    const next: ConsentPayload = {
      search: row.search,
      scroll: row.scroll,
      capture: row.capture,
      maxPages: row.maxPages,
      acknowledgedRisk: row.acknowledgedRisk || acknowledged,
      ...patch,
    };
    const enabling = (next.search && !row.search) || (next.scroll && !row.scroll) || (next.capture && !row.capture);
    if (enabling && !acknowledged && !row.acknowledgedRisk) {
      toast.error("Tick the acknowledgement first. Search and scrolling act in a visible browser.");
      return;
    }
    if (enabling) next.acknowledgedRisk = true;
    if (patch.search === false) {
      next.scroll = false;
      next.maxPages = 1;
    }
    if (patch.scroll === false || (patch.search === true && !next.scroll)) {
      next.maxPages = 1;
    }
    save.mutate({ source: row.source, payload: next });
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardContent className="p-0">
        <div className="border-b border-border/70 p-5">
          <h2 className="flex items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck className="size-4 text-primary" /> Browser permissions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search and scroll only run in the visible worker browser, one page at a time, inside the page cap you set.
            Applications and form filling stay separate.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 border-b border-border/70 bg-muted/25 px-5 py-4 text-sm">
          <Checkbox
            className="mt-0.5"
            checked={acknowledged}
            onCheckedChange={value => setAcknowledged(value === true)}
          />
          <span className="leading-5">
            I understand that enabling search or scrolling lets the worker read visible job posts and pages after I queue a task.
            It never messages anyone, never applies, and can be revoked here at any time.
          </span>
        </label>

        <ul className="divide-y divide-border/70">
          {consents.map(row => {
            const restricted = row.level !== "A";
            return (
              <li key={row.source} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{row.name}</p>
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-xs font-semibold ring-1",
                        row.level === "A"
                          ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                          : row.level === "B"
                            ? "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300"
                            : "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
                      )}>
                        Level {row.level}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{row.domains.join(" · ")}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="hidden sm:inline">{row.maxPagesLimit} page limit</span>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="flex flex-wrap gap-x-5 gap-y-3">
                    <label className={cn("flex items-center gap-2 text-xs", !row.searchCapability && "opacity-40")}>
                      <Switch
                        checked={row.search}
                        disabled={!row.searchCapability || save.isPending}
                        onCheckedChange={value => update(row, { search: value === true })}
                      />
                      Search
                    </label>
                    <label className={cn("flex items-center gap-2 text-xs", !row.scrollCapability && "opacity-40")}>
                      <Switch
                        checked={row.scroll}
                        disabled={!row.scrollCapability || save.isPending || !row.search}
                        onCheckedChange={value => update(row, { scroll: value === true })}
                      />
                      Scroll
                    </label>
                    <label className={cn("flex items-center gap-2 text-xs", !row.captureCapability && "opacity-40")}>
                      <Switch
                        checked={row.capture}
                        disabled={!row.captureCapability || save.isPending}
                        onCheckedChange={value => update(row, { capture: value === true })}
                      />
                      Check one page
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Pages
                    <Input
                      key={`${row.source}-${row.maxPages}-${row.scroll}`}
                      type="number"
                      min={1}
                      max={Math.min(row.maxPagesLimit, 10)}
                      defaultValue={row.maxPages}
                      disabled={!row.scroll || save.isPending}
                      onBlur={event => {
                        const value = Number(event.target.value);
                        if (!Number.isFinite(value)) return;
                        const next = Math.max(1, Math.min(Math.floor(value), row.maxPagesLimit, 10));
                        event.currentTarget.value = String(next);
                        if (next !== row.maxPages) update(row, { maxPages: next });
                      }}
                      className="h-8 w-20 text-center"
                    />
                  </label>
                </div>

                {restricted ? (
                  <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    This source needs a visible browser and may ask you to sign in. It never fills a form or submits an application.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-muted/20 px-5 py-3 text-xs leading-5 text-muted-foreground">
          <span>Permissions are per account and per source. Revoking one stops future tasks immediately.</span>
          {save.isPending ? <span className="inline-flex items-center gap-1.5"><Loader2 className="size-3.5 animate-spin" /> Saving</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}
