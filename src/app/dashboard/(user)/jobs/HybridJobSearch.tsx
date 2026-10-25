"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe2, Laptop, Loader2, Search, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type Source = "REMOTIVE" | "JOBICY" | "ARBEITNOW" | "GREENHOUSE" | "LEVER" | "FACEBOOK" | "LINKEDIN" | "BDJOBS";
type SearchResult = {
  savedJobIds: string[];
  queuedTaskIds: string[];
  failures: Array<{ source: string; message: string }>;
};

const OPEN: Array<{ id: Source; label: string }> = [
  { id: "REMOTIVE", label: "Remotive" },
  { id: "JOBICY", label: "Jobicy" },
  { id: "ARBEITNOW", label: "Arbeitnow" },
  { id: "GREENHOUSE", label: "Greenhouse" },
  { id: "LEVER", label: "Lever" },
];
const PRIVATE: Array<{ id: Source; label: string }> = [
  { id: "FACEBOOK", label: "Facebook" },
  { id: "LINKEDIN", label: "LinkedIn (manual handoff)" },
  { id: "BDJOBS", label: "BDJobs" },
];

export function HybridJobSearch() {
  const client = useQueryClient();
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState<Source[]>(["REMOTIVE", "JOBICY", "ARBEITNOW", "GREENHOUSE", "LEVER"]);
  const [consent, setConsent] = useState(false);
  const privateSelected = sources.some(source => PRIVATE.some(item => item.id === source));

  const toggle = (source: Source) => setSources(current =>
    current.includes(source) ? current.filter(item => item !== source) : [...current, source],
  );

  const search = useMutation({
    mutationFn: () => api.post<SearchResult>("/worker/job-searches", {
      query: query.trim(),
      sources,
      maxResults: 30,
      maximumAgeDays: 30,
      privateSourceConsent: consent,
    }),
    onSuccess: result => {
      void client.invalidateQueries({ queryKey: ["jobs"] });
      void client.invalidateQueries({ queryKey: ["worker-overview"] });
      const parts = [
        `${result.savedJobIds.length} open-web jobs saved`,
        `${result.queuedTaskIds.length} local browser searches queued`,
      ];
      toast.success(parts.join(" · "));
      for (const failure of result.failures.slice(0, 2)) toast.error(`${failure.source}: ${failure.message}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canRun = query.trim().length >= 2 && sources.length > 0 && (!privateSelected || consent);

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardContent className="p-0">
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Search className="size-4" /></span>
              <div><h2 className="font-semibold">Search everywhere</h2><p className="text-xs text-muted-foreground">Open sources run in ProfileAI. Login sources go to your paired local worker.</p></div>
            </div>
            <Input className="mt-4" value={query} onChange={event => setQuery(event.target.value)} placeholder="Frontend engineer, React, remote…" maxLength={200} />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SourceGroup icon={<Globe2 className="size-3.5" />} title="Open web" rows={OPEN} selected={sources} onToggle={toggle} />
              <SourceGroup icon={<Laptop className="size-3.5" />} title="Your browser" rows={PRIVATE} selected={sources} onToggle={toggle} />
            </div>
            {privateSelected ? (
              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[.05] px-3 py-2.5 text-xs leading-5">
                <Checkbox checked={consent} onCheckedChange={value => setConsent(value === true)} className="mt-0.5" />
                <span>I allow the local worker to open selected login sources. It must stop for login, CAPTCHA, OTP, or verification.</span>
              </label>
            ) : null}
          </div>
          <div className="flex flex-col items-stretch gap-2 lg:w-52">
            <Button disabled={!canRun || search.isPending} onClick={() => search.mutate()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {search.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
              {search.isPending ? "Searching…" : "Search jobs"}
            </Button>
            <span className="inline-flex items-center justify-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="size-3" /> No automatic submit</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SourceGroup({ icon, title, rows, selected, onToggle }: {
  icon: ReactNode;
  title: string;
  rows: Array<{ id: Source; label: string }>;
  selected: Source[];
  onToggle: (source: Source) => void;
}) {
  return (
    <fieldset className="rounded-xl border bg-muted/20 p-3">
      <legend className="flex items-center gap-1.5 px-1 text-xs font-semibold text-muted-foreground">{icon}{title}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {rows.map(row => (
          <label key={row.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border bg-background px-2.5 py-1.5 text-xs">
            <Checkbox checked={selected.includes(row.id)} onCheckedChange={() => onToggle(row.id)} />
            {row.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
