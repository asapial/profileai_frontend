"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe2,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Consent } from "./WorkerConsentPanel";

export type CapturedListing = {
  id: string;
  source: string;
  canonicalUrl: string;
  title: string;
  company: string;
  location: string;
  capturedAt: string;
  deviceId: string | null;
};

const SOURCE_LABEL: Record<string, string> = {
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  BDJOBS: "BDJobs",
  REMOTIVE: "Remotive",
  GREENHOUSE: "Greenhouse",
  LEVER: "Lever",
  ASHBY: "Ashby",
  COMPANY_CAREER: "Company career page",
  MANUAL: "Manual",
};

function guessSource(value: string): string | undefined {
  try {
    const host = new URL(value).hostname.toLowerCase();
    if (host.endsWith("linkedin.com")) return "LINKEDIN";
    if (host.endsWith("facebook.com") || host.endsWith("fb.com")) return "FACEBOOK";
    if (host.endsWith("bdjobs.com")) return "BDJOBS";
    if (host.endsWith("remotive.com")) return "REMOTIVE";
    if (host.endsWith("greenhouse.io")) return "GREENHOUSE";
    if (host.endsWith("lever.co")) return "LEVER";
    if (host.endsWith("ashbyhq.com")) return "ASHBY";
    if (host.startsWith("http")) return "COMPANY_CAREER";
  } catch {
    return undefined;
  }
  return undefined;
}

function relative(value: string) {
  const diff = Math.max(0, Date.now() - Date.parse(value));
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function WorkerInstructionPanel({ consents, listings }: { consents: Consent[]; listings: CapturedListing[] }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"search" | "capture">("search");
  const [source, setSource] = useState(() => consents.find(row => row.searchCapability)?.source ?? "LINKEDIN");
  const [query, setQuery] = useState("");
  const [startUrl, setStartUrl] = useState("");
  const [maxPages, setMaxPages] = useState(1);
  const [maxResults, setMaxResults] = useState(10);
  const [scrollRounds, setScrollRounds] = useState(0);
  const [searchAck, setSearchAck] = useState(false);
  const [captureUrl, setCaptureUrl] = useState("");
  const [captureAck, setCaptureAck] = useState(false);

  const selected = consents.find(row => row.source === source);
  const captureSource = guessSource(captureUrl);
  const captureConsent = captureSource ? consents.find(row => row.source === captureSource) : null;
  const searchReady = Boolean(selected?.search);
  const scrollReady = Boolean(selected?.scroll && selected.search);
  const canSearch = searchReady && searchAck && Boolean(query.trim() || startUrl.trim());
  const canCapture = Boolean(captureUrl.trim()) && captureAck && Boolean(captureConsent?.capture);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["worker-overview"] });

  const runSearch = useMutation({
    mutationFn: () => api.post<{ id: string }>("/worker/search-tasks", {
      source,
      ...(query.trim() ? { query: query.trim() } : {}),
      ...(startUrl.trim() ? { startUrl: startUrl.trim() } : {}),
      maxPages,
      maxResults,
      scrollRounds: scrollReady ? scrollRounds : 0,
      mode: "RESEARCH",
      consentAcknowledged: searchAck,
    }),
    onSuccess: () => {
      toast.success("Search queued. The worker will ask before leaving the approved pages.");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const runCapture = useMutation({
    mutationFn: () => api.post<{ id: string }>("/worker/capture-tasks", {
      url: captureUrl.trim(),
      ...(captureSource ? { source: captureSource } : {}),
      consentAcknowledged: captureAck,
    }),
    onSuccess: () => {
      toast.success("Page check queued. The worker will return the verified job details here.");
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const selectSource = (value: string) => {
    setSource(value);
    const consent = consents.find(row => row.source === value);
    if (consent) {
      setMaxPages(Math.max(1, Math.min(consent.maxPages, consent.maxPagesLimit, 10)));
      setScrollRounds(0);
    }
  };

  const searchable = consents.filter(row => row.searchCapability);
  const submittable = mode === "search" ? canSearch : canCapture;
  const pending = mode === "search" ? runSearch.isPending : runCapture.isPending;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3 border-b border-border/70 p-5">
          <div>
            <h2 className="flex items-center gap-2 font-semibold tracking-tight"><Globe2 className="size-4 text-primary" /> Browser instructions</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Tell the worker which visible pages to search or read. It opens the dedicated local browser, never your everyday browser.
            </p>
          </div>
          <span className="hidden rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 sm:inline dark:text-emerald-300">Consent required</span>
        </div>

        <div className="flex gap-1 border-b border-border/70 bg-muted/25 px-3 pt-3">
          {[
            { id: "search" as const, label: "Search jobs", icon: Search },
            { id: "capture" as const, label: "Check one page", icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-t-lg border border-b-0 px-3 py-2 text-xs font-medium transition-colors",
                mode === tab.id
                  ? "border-border bg-background text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="size-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {mode === "search" ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="worker-search-source">Source</Label>
                  <select
                    id="worker-search-source"
                    value={searchable.length ? source : ""}
                    onChange={event => selectSource(event.target.value)}
                    disabled={!searchable.length}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {searchable.length ? searchable.map(row => (
                      <option key={row.source} value={row.source}>
                        {row.name} (Level {row.level})
                      </option>
                    )) : <option value="">No search-capable source</option>}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="worker-search-query">What should it look for?</Label>
                  <Input
                    id="worker-search-query"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="software engineer, React, remote…"
                    maxLength={200}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="worker-search-url">Collection or search URL <span className="font-normal text-muted-foreground">(optional if a query is enough)</span></Label>
                <Input
                  id="worker-search-url"
                  value={startUrl}
                  onChange={event => setStartUrl(event.target.value)}
                  placeholder="Paste a Facebook collection, LinkedIn search, or career-page URL"
                  inputMode="url"
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  For a Facebook collection, paste the exact page you already have access to. The worker will only read what is visible there.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="worker-search-pages">Pages</Label>
                  <Input
                    id="worker-search-pages"
                    type="number"
                    min={1}
                    max={Math.max(1, Math.min(selected?.maxPages ?? 1, 10))}
                    value={scrollReady ? maxPages : 1}
                    disabled={!scrollReady}
                    onChange={event => setMaxPages(Math.max(1, Math.min(10, Number(event.target.value) || 1)))}
                  />
                  {!scrollReady ? <p className="text-xs text-muted-foreground">One page until Scroll is enabled.</p> : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="worker-search-results">Max results</Label>
                  <Input
                    id="worker-search-results"
                    type="number"
                    min={1}
                    max={25}
                    value={maxResults}
                    onChange={event => setMaxResults(Math.max(1, Math.min(25, Number(event.target.value) || 1)))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="worker-search-scroll">Scroll rounds</Label>
                  <Input
                    id="worker-search-scroll"
                    type="number"
                    min={0}
                    max={20}
                    value={scrollRounds}
                    disabled={!scrollReady}
                    onChange={event => setScrollRounds(Math.max(0, Math.min(20, Number(event.target.value) || 0)))}
                  />
                  {!scrollReady ? <p className="text-xs text-muted-foreground">Enable Scroll below first.</p> : null}
                </div>
              </div>

              {!searchReady ? (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[.06] px-3 py-2.5 text-xs leading-5 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Search is off for {SOURCE_LABEL[source] ?? source}. <Link href="#browser-permissions" className="font-semibold underline underline-offset-2">Enable it in Browser permissions</Link> first.
                  </span>
                </div>
              ) : null}

              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-xs leading-5">
                <Checkbox checked={searchAck} onCheckedChange={value => setSearchAck(value === true)} className="mt-0.5" />
                <span>For this task only, I allow the worker to search and read the visible results within the page cap. It will not message, apply, or fill a form.</span>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="worker-capture-url">Job or post URL</Label>
                <Input
                  id="worker-capture-url"
                  value={captureUrl}
                  onChange={event => setCaptureUrl(event.target.value)}
                  placeholder="https://www.linkedin.com/jobs/view/… or a Facebook post URL"
                  inputMode="url"
                />
                <p className="text-xs leading-5 text-muted-foreground">The worker opens this page in the dedicated browser, reads the visible details, and returns them here. No form filling.</p>
              </div>

              <div className={cn(
                "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5",
                captureConsent?.capture
                  ? "border-emerald-500/20 bg-emerald-500/[.05] text-emerald-800 dark:text-emerald-200"
                  : "border-amber-500/20 bg-amber-500/[.06] text-amber-800 dark:text-amber-200",
              )}>
                {captureConsent?.capture ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
                <span>
                  {captureUrl.trim()
                    ? captureConsent
                      ? captureConsent.capture
                        ? `Page check is enabled for ${captureConsent.name}.`
                        : `Page check is off for ${captureConsent.name}. Enable “Check one page” in Browser permissions first.`
                      : `This URL is not recognised. Use a reviewed source URL (${searchable.map(row => SOURCE_LABEL[row.source] ?? row.source).join(", ")}).`
                    : "Paste a URL to see which permission applies."}
                </span>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-xs leading-5">
                <Checkbox checked={captureAck} onCheckedChange={value => setCaptureAck(value === true)} className="mt-0.5" />
                <span>I allow the worker to read this page once and return the job details to my ProfileAI account.</span>
              </label>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-emerald-600" /> Signed task · visible browser · per-task consent</p>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!submittable || pending}
              onClick={() => mode === "search" ? runSearch.mutate() : runCapture.mutate()}
            >
              {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
              {mode === "search" ? "Queue browser search" : "Queue page check"}
            </Button>
          </div>
        </div>

        <div className="border-t border-border/70">
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <h3 className="text-sm font-semibold text-foreground">Returned findings</h3>
            <span className="text-xs text-muted-foreground">{listings.length} recent</span>
          </div>
          {listings.length ? (
            <ul className="divide-y divide-border/60 border-t border-border/60">
              {listings.slice(0, 6).map(listing => (
                <li key={listing.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{listing.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {listing.company}{listing.location ? ` · ${listing.location}` : ""} · {SOURCE_LABEL[listing.source] ?? listing.source} · {relative(listing.capturedAt)}
                    </p>
                  </div>
                  <a href={listing.canonicalUrl} target="_blank" rel="noreferrer" className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground" aria-label="Open captured listing">
                    <ExternalLink className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border-t border-border/60 px-5 py-6 text-center">
              <Search className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No captured listings yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Queue a search or a single page check. Results will appear here after the worker returns them.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
