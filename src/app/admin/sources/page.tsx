"use client";

import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { DatabaseZap, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

type SourceHealth = {
  id: string;
  company: string;
  provider: string;
  board: string;
  failures: number;
  enabled: boolean;
  lastError: string | null;
};

const TEXT_FIELDS = [
  ["board", "Board identifier"],
  ["company", "Company"],
  ["attribution", "Attribution"],
  ["reference", "Policy reference URL"],
] as const;

const POLICY_FIELDS = [
  ["storage", "Storage permitted"],
  ["republication", "Republication permitted"],
  ["indexing", "Indexing permitted"],
  ["enabled", "Enable reviewed source"],
] as const;

const selectClass =
  "mt-2 min-h-11 w-full rounded-[var(--radius-control)] border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function SourcesPage() {
  const query = useQuery({
    queryKey: ["source-health"],
    queryFn: () => api.get<SourceHealth[]>("/career/admin/sources"),
  });
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await api.post("/career/admin/sources", {
        provider: form.get("provider"),
        board: form.get("board"),
        company: form.get("company"),
        enabled: form.get("enabled") === "on",
        policy: {
          accessMethod: "PUBLIC_API",
          storageAllowed: form.get("storage") === "on",
          republicationAllowed: form.get("republication") === "on",
          indexingAllowed: form.get("indexing") === "on",
          retentionDays: Number(form.get("retention")),
          attribution: form.get("attribution"),
          display: form.get("display"),
          reviewedAt: new Date().toISOString(),
          reference: form.get("reference"),
        },
      });
      await query.refetch();
      toast.success("Policy saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <AdminPageHeader
        eyebrow="Acquisition governance"
        title="Source policy & health"
        description="Approve only boards whose access, storage, and republication policy has been reviewed. Three consecutive failures automatically pause a source."
      />

      {query.isError ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {query.error.message}
        </div>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" /> Review a source
            </CardTitle>
            <CardDescription>Record the policy evidence before enabling ingestion.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
              <Label>
                Provider
                <select name="provider" className={selectClass}>
                  <option>LEVER</option>
                  <option>GREENHOUSE</option>
                </select>
              </Label>

              {TEXT_FIELDS.map(([name, label]) => (
                <Label key={name}>
                  {label}
                  <Input required name={name} type={name === "reference" ? "url" : "text"} className="mt-2" />
                </Label>
              ))}

              <Label>
                Display mode
                <select name="display" className={selectClass}>
                  <option value="LINK_ONLY">Private link only</option>
                  <option value="SUMMARY">Attributed summary</option>
                  <option value="FULL">Full description</option>
                </select>
              </Label>

              <Label>
                Retention days
                <Input name="retention" type="number" min={1} max={90} defaultValue={30} className="mt-2" />
              </Label>

              <div className="grid gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:col-span-2 sm:grid-cols-2">
                {POLICY_FIELDS.map(([name, label]) => (
                  <Label key={name} className="flex min-h-11 items-center gap-3 font-medium">
                    <Checkbox name={name} />
                    {label}
                  </Label>
                ))}
              </div>

              <Button disabled={busy} type="submit" className="sm:col-span-2 sm:w-fit">
                {busy ? "Saving…" : "Save reviewed policy"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <section aria-labelledby="source-health-title" className="space-y-3">
          <div>
            <h2 id="source-health-title" className="text-lg font-semibold">Reviewed sources</h2>
            <p className="mt-1 text-sm text-muted-foreground">Current ingest health and pause state.</p>
          </div>
          {query.isLoading ? (
            <Card><CardContent className="py-8 text-sm text-muted-foreground">Loading source health…</CardContent></Card>
          ) : query.data?.length ? (
            query.data.map((source) => (
              <Card key={source.id}>
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{source.company}</CardTitle>
                      <CardDescription className="mt-1 break-all">{source.provider} / {source.board}</CardDescription>
                    </div>
                    <Badge variant={source.enabled ? "default" : "secondary"}>{source.enabled ? "Enabled" : "Paused"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <DatabaseZap className="size-4" /> {source.failures} consecutive failures
                  </p>
                  {source.lastError ? <p className="rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">{source.lastError}</p> : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card><CardContent className="py-8 text-sm text-muted-foreground">No reviewed sources yet.</CardContent></Card>
          )}
        </section>
      </div>
    </div>
  );
}
