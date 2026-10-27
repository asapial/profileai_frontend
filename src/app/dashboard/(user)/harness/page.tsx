"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronDown,
  CircleStop,
  Cloud,
  Copy,
  Download,
  ExternalLink,
  FileText,
  HardDrive,
  Link2,
  Mail,
  Pause,
  Play,
  ShieldCheck,
  Sheet,
  Unplug,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { env } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import styles from "./harness.module.css";
import { AutomationNavigation } from "@/components/dashboard/AutomationNavigation";
import { companionIsOnline, csvCell } from "@/lib/automation-workflow";

type Preferences = {
  roles: string[];
  seniority: string;
  requiredSkills: string[];
  optionalSkills: string[];
  excludedSkills: string[];
  workplace: string;
  preferredCountries: string[];
  allowedCountries: string[];
  workAuthorization: string;
  requiresVisaSponsorship: boolean | null;
  minimumSalary: number | null;
  salaryCurrency: string;
  employmentTypes: string[];
  timeZones: string[];
  availability: string;
  companySizes: string[];
  industries: string[];
  excludedCompanies: string[];
  excludedSources: string[];
  maximumJobAgeDays: number;
  minimumMatchScore: number;
  dailySearchLimit: number;
  automaticSearchHours: 0 | 12 | 24;
  dailyApplicationLimit: number;
  autoSaveThreshold: number;
  autoPrepareThreshold: number;
  autoApplyThreshold: number;
  resumeStyle: string;
  resumePageLimit: number;
  coverLetterStyle: string;
  emailTone: string;
  salaryAnswerPolicy: string;
  noticePeriod: string;
  earliestStartDate: string | null;
  relocation: string;
  portfolioUrls: string[];
  allowedAutoApplyDomains: string[];
  requireApprovalBeforeSubmit: boolean;
  stopOnCaptcha: true;
  stopOnOtp: true;
  stopOnLegalAgreement: true;
  stopOnUnknownRequiredQuestion: true;
  neverAnswerDemographic: true;
  neverAnswerDisability: true;
  neverAnswerCriminalHistory: true;
};

type RunStep = { id: string; key: string; state: string; error: string | null; blocker: string | null; output?: Record<string, unknown> | null };
type Run = { id: string; mode: string; state: string; createdAt: string; steps: RunStep[] };
type SheetRow = {
  jobId: string;
  title: string;
  company: string;
  location: string | null;
  canonicalUrl: string | null;
  sourceName: string;
  lifecycle: string;
  score: number;
  decision: string;
  reasons: unknown;
  missing: unknown;
  status: "MATCHED" | "CV_READY" | "READY_FOR_REVIEW" | "BROWSER_QUEUED" | "APPLIED";
  resumeId: string | null;
  documentId: string | null;
  subject: string | null;
  body: string | null;
  atsScore: number | null;
  decidedAt: string;
};
type SheetStats = { total: number; eligible: number; reviewRequired: number; cvs: number; drafts: number; queued: number; applied: number };
type Overview = {
  configured: { google: boolean; companionOrigins: boolean };
  preference: { version: number; preferences: Preferences };
  runs: Run[];
  google: null | { email: string; status: string; capabilities: Array<{ capability: string; enabled: boolean }> };
  tracker: null | { externalUrl: string | null; lastSyncedAt: string };
  companions: Array<{ id: string; name: string; status: string; lastSeenAt: string | null; expiresAt: string }>;
  reviewTasks: Array<{ deviceId: string | null; id: string; state: string; adapter: string; targetUrl: string; mode: string; error: string | null }>;
  candidates: Array<{ id: string; score: number; decision: string; reasons: unknown; missing: unknown; job: null | { id: string; company: string; title: string; location: string | null; canonicalUrl: string | null; lifecycle: string } }>;
  sheet: SheetRow[];
  sheetStats: SheetStats;
  audits: Array<{ id: string; runId: string | null; action: string; outcome: string; metadata: { message?: string; step?: string; eventAt?: string } | null; createdAt: string }>;
};

const sheetStatusLabel: Record<SheetRow["status"], string> = {
  MATCHED: "Matched",
  CV_READY: "CV ready",
  READY_FOR_REVIEW: "CV + email ready",
  BROWSER_QUEUED: "In browser queue",
  APPLIED: "Applied",
};

const sheetStatusTone: Record<SheetRow["status"], string> = {
  MATCHED: "#64748b",
  CV_READY: "#2f6bff",
  READY_FOR_REVIEW: "#23a878",
  BROWSER_QUEUED: "#d99125",
  APPLIED: "#7c3aed",
};

function gmailComposeUrl(row: SheetRow) {
  const params = new URLSearchParams({ view: "cm", fs: "1", su: row.subject ?? `${row.title} application`, body: row.body ?? "" });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function downloadSheetCsv(rows: SheetRow[]) {
  const header = ["Company", "Role", "Location", "Source", "Score", "Decision", "Status", "ATS", "Job URL", "Email subject"];
  const lines = [header, ...rows.map(row => [
    row.company, row.title, row.location ?? "", row.sourceName, String(row.score), row.decision,
    sheetStatusLabel[row.status], row.atsScore === null ? "" : String(row.atsScore), row.canonicalUrl ?? "", row.subject ?? "",
  ])].map(cells => cells.map(csvCell).join(","));
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "profileai-job-sheet.csv";
  link.click();
  URL.revokeObjectURL(url);
}

type DecisionReason = { rule: string; outcome: "MATCH" | "RISK"; detail: string };

function readReasons(value: unknown): DecisionReason[] {
  return Array.isArray(value) ? value.filter((item): item is DecisionReason => typeof item === "object" && item !== null && typeof (item as DecisionReason).detail === "string") : [];
}

function readMissing(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

async function copyDraft(row: SheetRow) {
  const text = `Subject: ${row.subject ?? `${row.title} application`}\n\n${row.body ?? ""}`;
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Email draft copied");
  } catch {
    toast.error("Clipboard is not available in this browser");
  }
}

const connectionItems = [
  { capability: "DRIVE_DOCUMENTS", title: "Google Drive", detail: "Store generated resumes and application bundles.", icon: HardDrive },
  { capability: "DRIVE_APP_DATA", title: "Private Drive data", detail: "Back up preferences inside Drive appDataFolder.", icon: Cloud },
  { capability: "SHEET_TRACKER", title: "Google Sheets", detail: "Mirror verified jobs and application status.", icon: Sheet },
  { capability: "GMAIL_DRAFTS", title: "Gmail drafts", detail: "Create unsent, reviewable application drafts.", icon: Mail },
] as const;

const stepNames: Record<string, string> = {
  DISCOVER: "Search connected job feeds",
  VERIFY: "Verify listing freshness",
  MATCH: "Apply preference policy",
  PREPARE_DOCUMENTS: "Prepare evidence-backed documents",
  GOOGLE_SYNC: "Sync user-owned Google workspace",
  BROWSER_PREPARE: "Hand off application forms",
};

export default function HarnessPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["harness"], queryFn: () => api.get<Overview>("/harness"), refetchInterval: current => current.state.data?.runs.some(run => ["SCHEDULED", "RUNNING", "WAITING_FOR_USER"].includes(run.state)) ? 3_000 : 12_000 });
  const [busy, setBusy] = useState("");
  const busyRef = useRef("");
  const [mode, setMode] = useState("PREPARE");
  const [draft, setForm] = useState<Preferences | null>(null);
  const [pairToken, setPairToken] = useState("");
  const [preferenceStep, setPreferenceStep] = useState(0);
  const [openJob, setOpenJob] = useState<string | null>(null);
  const form = draft ?? query.data?.preference.preferences ?? null;
  useEffect(() => {
    const expected = new URL(env.apiBaseUrl).origin;
    const handler = (event: MessageEvent) => {
      if (event.origin !== expected || event.data?.type !== "profileai:google-connected") return;
      toast.success(`Connected ${event.data.email}`);
      void client.invalidateQueries({ queryKey: ["harness"] });
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [client]);

  const activeRun = query.data?.runs.find(run => ["SCHEDULED", "RUNNING", "PAUSED", "WAITING_FOR_USER"].includes(run.state));
  const latestRun = activeRun ?? query.data?.runs[0];
  const audits = query.data?.audits ?? [];
  const localEvents = audits.filter(event => event.action === 'WORKER_LOCAL_PROGRESS' && event.metadata?.message).slice(0, 20).sort((a, b) => (a.metadata?.eventAt ?? a.createdAt).localeCompare(b.metadata?.eventAt ?? b.createdAt));
  const activityRuns = (query.data?.runs ?? [])
    .map(run => ({ run, events: audits.filter(event => event.runId === run.id && event.metadata?.message).slice().reverse() }))
    .filter(entry => entry.events.length)
    .slice(0, 4);
  const syncOutput = (latestRun?.steps.find(step => step.key === "GOOGLE_SYNC")?.output ?? null) as { warnings?: unknown } | null;
  const syncWarnings = Array.isArray(syncOutput?.warnings) ? syncOutput.warnings.filter((item): item is string => typeof item === "string") : [];
  const capabilitySet = useMemo(() => new Set(query.data?.google?.capabilities.filter(item => item.enabled).map(item => item.capability) ?? []), [query.data?.google]);

  async function action(name: string, task: () => Promise<unknown>, message?: string) {
    if (busyRef.current && name !== "stop") return;
    busyRef.current = name;
    setBusy(name);
    try {
      await task();
      if (message) toast.success(message);
      await client.invalidateQueries({ queryKey: ["harness"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Action failed."); }
    finally { if (busyRef.current === name) { busyRef.current = ""; setBusy(""); } }
  }

  async function connect(capability: string) {
    if (busyRef.current) return;
    const popup = window.open("about:blank", "profileai-google", "popup=yes,width=540,height=700");
    if (!popup) { toast.error("Popup blocked. Allow popups and try again."); return; }
    await action(`connect-${capability}`, async () => {
      try {
      const result = await api.post<{ url: string }>("/harness/google/connect", { capabilities: [capability], popupOrigin: window.location.origin });
      popup.location.href = result.url;
      } catch (error) { popup.close(); throw error; }
    });
  }

  if (query.isError) return <div className={styles.page}><div className={styles.panel}><div className="p-8"><h1 className="text-xl font-semibold">Harness could not load</h1><p className="mt-2 text-sm text-muted-foreground">Please retry loading your workspace.</p><button className="mt-4 underline" onClick={() => void query.refetch()}>Retry</button></div></div></div>;
  if (query.isPending || !query.data || !form) return <div className={styles.page}><div className={`${styles.masthead} animate-pulse`} /></div>;

  const browserReady = query.data.companions.some(companion => companionIsOnline(companion, query.dataUpdatedAt));
  const setup = [
    { label: "Profile", ready: true, detail: "Career evidence workspace" },
    { label: "Preferences", ready: query.data.preference.version > 0 && query.data.preference.preferences.roles.length > 0, detail: query.data.preference.version ? `Version ${query.data.preference.version}` : "Not saved" },
    { label: "Google", ready: Boolean(query.data.google), detail: query.data.google?.email ?? "Not connected" },
    { label: "Browser", ready: Boolean(browserReady), detail: browserReady ? "Recently connected" : query.data.companions.length ? "Offline or awaiting connection" : "Not paired" },
  ];
  const sheetStats = query.data.sheetStats;
  const sheetStatItems: Array<[string, number]> = [["Total", sheetStats.total], ["Eligible", sheetStats.eligible], ["Needs review", sheetStats.reviewRequired], ["CVs", sheetStats.cvs], ["Drafts", sheetStats.drafts], ["In queue", sheetStats.queued], ["Applied", sheetStats.applied]];

  return (
    <div className={styles.page}>
      <AutomationNavigation current="harness" />
      <section className={styles.masthead}>
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-8">
          <div>
            <div className="mb-6 flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300"><span className={styles.statusDot} />Hybrid agent workspace</div>
            <h1 className={styles.title}>From shortlist to a reviewed application.</h1>
            <p className={styles.lede}>ProfileAI searches approved sources, verifies fit, prepares evidence-backed documents, syncs your Google workspace, then hands logged-in forms to your browser.</p>
          </div>
          <div className="relative z-10 flex max-w-sm flex-wrap justify-end gap-2">
            <select aria-label="Harness mode" className={styles.input} value={mode} onChange={event => setMode(event.target.value)} disabled={Boolean(activeRun)}>
              <option value="RESEARCH">Research only</option>
              <option value="PREPARE">Prepare applications</option>
              <option value="REVIEW_SUBMIT">Review and submit</option>
              <option value="AUTO_APPLY">Approved auto apply</option>
            </select>
            {!activeRun ? <Button disabled={Boolean(busy) || Boolean(draft) || !query.data.preference.version || !query.data.preference.preferences.roles.length} onClick={() => void action("start", () => api.post("/harness/runs", { mode, consent: true }), "Harness run queued")}><Play className="mr-2 size-4" />Start harness</Button> : (
              <>
                {activeRun.state === "PAUSED" || (activeRun.state === "WAITING_FOR_USER" && activeRun.steps.some(step => step.state === "BLOCKED")) ? <Button variant="outline" disabled={Boolean(busy)} onClick={() => void action("resume", () => api.post(`/harness/runs/${activeRun.id}/resume`, {}))}><Play className="mr-2 size-4" />Resume</Button> : activeRun.state !== "WAITING_FOR_USER" ? <Button variant="outline" disabled={Boolean(busy)} onClick={() => void action("pause", () => api.post(`/harness/runs/${activeRun.id}/pause`, {}))}><Pause className="mr-2 size-4" />Pause</Button> : null}
                <Button variant="destructive" disabled={busy === "stop"} onClick={() => void action("stop", () => api.post(`/harness/runs/${activeRun.id}/emergency-stop`, {}), "Harness stopped")}><CircleStop className="mr-2 size-4" />Emergency stop</Button>
              </>
            )}
          </div>
        </div>
      </section>

      {draft && <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm"><span>Unsaved preferences. Save them before starting a new run.</span><button type="button" className="font-medium underline" onClick={() => setForm(null)}>Discard changes</button></div>}
      <section className={styles.setupStrip} aria-label="Harness setup">
        {setup.map(item => <div key={item.label} className={styles.setupItem}><div className="flex items-center gap-2 text-sm font-semibold">{item.ready ? <Check className="size-4 text-emerald-600" /> : <AlertTriangle className="size-4 text-amber-600" />}{item.label}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p></div>)}
      </section>

      <div className={styles.workspace}>
        <div className="space-y-4">
          <section className={`${styles.panel} ${styles.activityPanel}`} aria-live="polite">
            <header className={styles.panelHeader}><div><h2 className="font-semibold">Live activity</h2><p className="mt-1 text-xs text-muted-foreground">Search, decisions, documents, and sync appear here as they happen.</p></div><span className={styles.liveState} data-state={latestRun?.state ?? "IDLE"}><span />{activeRun?.state === "RUNNING" || activeRun?.state === "SCHEDULED" ? "Working" : latestRun?.state === "COMPLETED" ? "Complete" : latestRun?.state === "WAITING_FOR_USER" ? "Needs you" : latestRun?.state === "PAUSED" ? "Paused" : latestRun?.state === "FAILED" ? "Failed" : latestRun?.state === "CANCELLED" ? "Stopped" : "Idle"}</span></header>
            <div className={styles.activityFeed}>
              {localEvents.length > 0 && <><div className={styles.runDivider}><span>Local worker · recent search</span></div>{localEvents.map(event => <article className={styles.activityMessage} key={event.id}><div className={`${styles.agentMark} ${event.outcome === 'PARTIAL' ? styles.agentMarkWarning : ''}`}><Bot className="size-4" /></div><div><div className="flex flex-wrap items-center gap-2"><strong>Local worker</strong><time>{new Date(event.metadata?.eventAt ?? event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div><p>{event.metadata?.message}</p>{event.outcome === 'PARTIAL' && <span className={styles.activityAction}>Action needed</span>}</div></article>)}</>}
              {activityRuns.length ? activityRuns.map(entry => <Fragment key={entry.run.id}>
                <div className={styles.runDivider}><span>Run · {entry.run.mode.replaceAll("_", " ").toLowerCase()}</span><time>{new Date(entry.run.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time><Badge variant="outline">{entry.run.state}</Badge></div>
                {entry.events.map(event => {
                  const warning = ["FAILED", "RETRYABLE", "WAITING_FOR_USER", "PARTIAL"].includes(event.outcome);
                  return <article className={styles.activityMessage} key={event.id}><div className={`${styles.agentMark} ${warning ? styles.agentMarkWarning : ""}`}><Bot className="size-4" /></div><div><div className="flex flex-wrap items-center gap-2"><strong>ProfileAI agent</strong><time>{new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div><p>{event.metadata?.message}</p>{warning && <span className={styles.activityAction}>Action needed</span>}</div></article>;
                })}
              </Fragment>) : !localEvents.length && <div className={styles.activityEmpty}><Bot className="size-5" /><p>Save preferences, connect Google, then start a run. Progress will appear here.</p></div>}
              {(activeRun?.state === "RUNNING" || activeRun?.state === "SCHEDULED") && <div className={styles.typing} aria-label="Agent is working"><span /><span /><span /></div>}
            </div>
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHeader}><div><h2 className="font-semibold">Run rail</h2><p className="mt-1 text-xs text-muted-foreground">Each step records input, output, retries, and blockers.</p></div><Badge variant="outline">{latestRun?.state ?? "Not started"}</Badge></header>
            <div className={styles.runRail}>
              {(latestRun?.steps ?? Object.keys(stepNames).map((key, position) => ({ id: key, key, state: "PENDING", error: null, blocker: null, position }))).map(step => {
                const stateClass = step.state === "SUCCEEDED" ? styles.stepSuccess : step.state === "RUNNING" ? styles.stepRunning : ["FAILED", "CANCELLED"].includes(step.state) ? styles.stepFailed : ["BLOCKED", "RETRYABLE"].includes(step.state) ? styles.stepWarning : "";
                return <div key={step.id} className={styles.runStep}><span className={`${styles.stepNode} ${stateClass}`} /><div><p className="text-sm font-semibold">{stepNames[step.key] ?? step.key}</p><p className="mt-1 text-xs text-muted-foreground">{step.error ?? step.blocker ?? (step.state === "PENDING" ? "Waiting for the previous step." : step.state.toLowerCase().replaceAll("_", " "))}</p></div><span className="text-xs font-medium text-muted-foreground">{step.state}</span></div>;
              })}
            </div>
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHeader}><div><h2 className="font-semibold">Job sheet</h2><p className="mt-1 text-xs text-muted-foreground">Every verified job with its score, tailored CV, and email draft. Expand a row to review the kit.</p></div><Button size="sm" variant="outline" disabled={!query.data.sheet.length} onClick={() => downloadSheetCsv(query.data.sheet)}><Download className="mr-2 size-4" />Download CSV</Button></header>
            {syncWarnings.length > 0 && <div className={styles.sheetWarning}><AlertTriangle className="size-4 shrink-0" /><div><strong>Google workspace sync was partial</strong>{syncWarnings.slice(0, 3).map(warning => <p key={warning}>{warning}</p>)}</div></div>}
            {query.data.sheet.length ? <>
              <div className={styles.sheetStats}>{sheetStatItems.map(([label, value]) => <div className={styles.sheetStat} key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
              <div className={styles.sheetWrap}>
                {query.data.sheet.map(row => {
                  const open = openJob === row.jobId;
                  const reasons = readReasons(row.reasons);
                  const missing = readMissing(row.missing);
                  return <article className={`${styles.sheetRow} ${open ? styles.sheetRowOpen : ""}`} key={row.jobId}>
                    <button type="button" className={styles.sheetHead} aria-expanded={open} onClick={() => setOpenJob(open ? null : row.jobId)}>
                      <span className={styles.scoreSmall}>{row.score}</span>
                      <span className={styles.sheetMeta}><strong>{row.title}</strong><small>{row.company}{row.location ? ` · ${row.location}` : ""} · {row.sourceName}</small></span>
                      <span className={styles.sheetStatus} style={{ color: sheetStatusTone[row.status] }}>{sheetStatusLabel[row.status]}</span>
                      <ChevronDown className={`${styles.sheetCaret} ${open ? styles.sheetCaretOpen : ""}`} />
                    </button>
                    {open && <div className={styles.kitCell}>
                      <div className={styles.kitGrid}>
                        <div className={styles.kitCard}>
                          <span className={styles.kitLabel}>Tailored CV</span>
                          {row.resumeId ? <><p className={styles.kitSubject}>Resume {row.resumeId.slice(-6)}{row.atsScore !== null ? ` · ATS ${row.atsScore}/100` : ""}</p><div className={styles.kitActions}><Link className={styles.kitButton} href={`/dashboard/resume/${row.resumeId}/edit`}>Open CV<ExternalLink className="size-3.5" /></Link></div></> : <p className={styles.kitBody}>No CV prepared for this job yet. Run a PREPARE harness run.</p>}
                        </div>
                        <div className={styles.kitCard}>
                          <span className={styles.kitLabel}>Email draft</span>
                          {row.body ? <><p className={styles.kitSubject}>{row.subject ?? `${row.title} application`}</p><p className={styles.kitBody}>{row.body}</p><div className={styles.kitActions}><a className={styles.kitButton} href={gmailComposeUrl(row)} target="_blank" rel="noreferrer">Open in Gmail<ExternalLink className="size-3.5" /></a><button type="button" className={styles.kitButton} onClick={() => void copyDraft(row)}><Copy className="size-3.5" />Copy draft</button></div></> : <p className={styles.kitBody}>No draft written yet. Run a PREPARE harness run.</p>}
                        </div>
                        <div className={styles.kitCard}>
                          <span className={styles.kitLabel}>Why this score · {row.decision.replaceAll("_", " ").toLowerCase()}</span>
                          <div className={styles.kitReasons}>{reasons.map(reason => <p key={`${reason.rule}-${reason.detail}`} data-outcome={reason.outcome}><strong>{reason.outcome === "MATCH" ? "Fit" : "Risk"}</strong>{reason.detail}</p>)}{missing.map(item => <p key={item} data-outcome="MISSING"><strong>Gap</strong>{item}</p>)}{!reasons.length && !missing.length && <p><strong>Info</strong>No scoring detail was recorded for this job.</p>}</div>
                          {row.canonicalUrl && <div className={styles.kitActions}><a className={styles.kitButton} href={row.canonicalUrl} target="_blank" rel="noreferrer">Open job post<ExternalLink className="size-3.5" /></a></div>}
                        </div>
                      </div>
                    </div>}
                  </article>;
                })}
              </div>
            </> : <div className="p-8 text-sm text-muted-foreground">Start a run to build the first verified job sheet.</div>}
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHeader}><div><h2 className="font-semibold">Harness preferences</h2><p className="mt-1 text-xs text-muted-foreground">Changes apply to future runs. Save all three sections together.</p></div><FileText className="size-5 text-blue-600" /></header>
            <form aria-label="Harness preferences" onSubmit={event => { event.preventDefault(); void action("preferences", async () => { const submitted = form; await api.put("/harness/preferences", submitted); setForm(current => current === submitted ? null : current); }, "Preferences saved"); }}>
              <div className={styles.preferenceSteps} role="tablist" aria-label="Preference sections">
                {["Target jobs", "Eligibility", "Automation"].map((label, index) => <button key={label} type="button" role="tab" aria-selected={preferenceStep === index} className={preferenceStep === index ? styles.preferenceStepActive : styles.preferenceStep} onClick={() => setPreferenceStep(index)}><span>{index + 1}</span>{label}</button>)}
              </div>
              <div className={styles.formGrid}>
                {preferenceStep === 0 && <>
                  <Field label="What roles do you want?" full><TagInput value={form.roles} onChange={roles => setForm({ ...form, roles })} placeholder="Type a role, then press Enter" /></Field>
                  <Field label="Seniority"><select className={styles.input} value={form.seniority} onChange={event => setForm({ ...form, seniority: event.target.value })}><option>ANY</option><option>INTERN</option><option>ENTRY</option><option>JUNIOR</option><option>MID</option><option>SENIOR</option><option>LEAD</option></select></Field>
                  <Field label="Workplace"><select className={styles.input} value={form.workplace} onChange={event => setForm({ ...form, workplace: event.target.value })}><option>ANY</option><option>REMOTE</option><option>HYBRID</option><option>ON_SITE</option></select></Field>
                  <Field label="Countries" full><TagInput value={form.allowedCountries} onChange={allowedCountries => setForm({ ...form, allowedCountries })} placeholder="Bangladesh, Worldwide" /></Field>
                  <Field label="Minimum salary"><input className={styles.input} type="number" min="0" value={form.minimumSalary ?? ""} onChange={event => setForm({ ...form, minimumSalary: event.target.value ? Number(event.target.value) : null })} placeholder="Optional" /></Field>
                  <Field label="Currency"><input className={styles.input} maxLength={3} value={form.salaryCurrency} onChange={event => setForm({ ...form, salaryCurrency: event.target.value.toUpperCase() })} /></Field>
                  <Field label="Maximum listing age"><input className={styles.input} type="number" min="1" max="120" value={form.maximumJobAgeDays} onChange={event => setForm({ ...form, maximumJobAgeDays: Number(event.target.value) })} /></Field>
                  <Field label="Jobs to search daily"><input className={styles.input} type="number" min="1" max="500" value={form.dailySearchLimit} onChange={event => setForm({ ...form, dailySearchLimit: Number(event.target.value) })} /></Field>
                </>}
                {preferenceStep === 1 && <>
                  <Field label="Must-have skills" full><TagInput value={form.requiredSkills} onChange={requiredSkills => setForm({ ...form, requiredSkills })} placeholder="React, TypeScript" /></Field>
                  <Field label="Nice-to-have skills" full><TagInput value={form.optionalSkills} onChange={optionalSkills => setForm({ ...form, optionalSkills })} placeholder="Next.js, GraphQL" /></Field>
                  <Field label="Skills to avoid" full><TagInput value={form.excludedSkills} onChange={excludedSkills => setForm({ ...form, excludedSkills })} placeholder="Add only real exclusions" /></Field>
                  <Field label="Work authorization" full><textarea className={styles.input} rows={3} value={form.workAuthorization} onChange={event => setForm({ ...form, workAuthorization: event.target.value })} placeholder="Example: Authorized to work in Bangladesh. Requires sponsorship elsewhere." /></Field>
                  <Field label="Need visa sponsorship?"><select className={styles.input} value={form.requiresVisaSponsorship === null ? "UNKNOWN" : form.requiresVisaSponsorship ? "YES" : "NO"} onChange={event => setForm({ ...form, requiresVisaSponsorship: event.target.value === "UNKNOWN" ? null : event.target.value === "YES" })}><option value="UNKNOWN">Ask me</option><option value="YES">Yes</option><option value="NO">No</option></select></Field>
                  <Field label="Relocation"><select className={styles.input} value={form.relocation} onChange={event => setForm({ ...form, relocation: event.target.value })}><option value="DISCUSS">Discuss first</option><option value="YES">Yes</option><option value="NO">No</option></select></Field>
                  <Field label="Notice period"><input className={styles.input} value={form.noticePeriod} onChange={event => setForm({ ...form, noticePeriod: event.target.value })} placeholder="30 days" /></Field>
                  <Field label="Earliest start date"><input className={styles.input} type="date" value={form.earliestStartDate ?? ""} onChange={event => setForm({ ...form, earliestStartDate: event.target.value || null })} /></Field>
                  <Field label="Portfolio links" full><TagInput value={form.portfolioUrls} onChange={portfolioUrls => setForm({ ...form, portfolioUrls })} placeholder="https://yourportfolio.com" /></Field>
                </>}
                {preferenceStep === 2 && <>
                  <Field label="Automatic public job search"><select className={styles.input} value={form.automaticSearchHours ?? 0} onChange={event => setForm({ ...form, automaticSearchHours: Number(event.target.value) as 0 | 12 | 24 })}><option value={0}>Off</option><option value={24}>Once every 24 hours</option><option value={12}>Once every 12 hours</option></select></Field>
                  <p className={`${styles.full} text-xs text-muted-foreground`}>The paired worker searches public Remotive listings while your computer is on. It can use a cached permission for up to 36 hours offline. New jobs trigger preparation and Google sync when ProfileAI reconnects.</p>
                  <Field label="Minimum match score"><input className={styles.input} type="number" min="0" max="100" value={form.minimumMatchScore} onChange={event => setForm({ ...form, minimumMatchScore: Number(event.target.value) })} /></Field>
                  <Field label="Applications prepared daily"><input className={styles.input} type="number" min="1" max="50" value={form.dailyApplicationLimit} onChange={event => setForm({ ...form, dailyApplicationLimit: Number(event.target.value) })} /></Field>
                  <Field label="Allowed auto-apply sites" full><TagInput value={form.allowedAutoApplyDomains} onChange={allowedAutoApplyDomains => setForm({ ...form, allowedAutoApplyDomains: allowedAutoApplyDomains.map(value => value.toLowerCase()) })} placeholder="boards.greenhouse.io" /></Field>
                  <label className={`${styles.full} ${styles.approvalCard}`}><input type="checkbox" checked={form.requireApprovalBeforeSubmit} onChange={event => setForm({ ...form, requireApprovalBeforeSubmit: event.target.checked })} /><span><strong>Ask before every final submission</strong><small>Recommended until each job site passes real-world testing.</small></span></label>
                  <div className={`${styles.full} ${styles.safetyNote}`}><strong>Always stops</strong><span>CAPTCHA, OTP, legal agreements, demographics, disability, criminal history, and unknown required questions.</span></div>
                </>}
              </div>
              <div className={styles.preferenceActions}>
                <Button type="button" variant="ghost" disabled={preferenceStep === 0} onClick={() => setPreferenceStep(step => Math.max(0, step - 1))}>Back</Button>
                {preferenceStep < 2 ? <Button key="continue" type="button" onClick={event => { event.preventDefault(); setPreferenceStep(step => Math.min(2, step + 1)); }}>Continue</Button> : <Button key="save" type="submit" disabled={busy === "preferences" || !form.roles.length || !draft}>Save preferences</Button>}
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-4">
          <section className={styles.panel}>
            <header className={styles.panelHeader}><div><h2 className="font-semibold">Connections</h2><p className="mt-1 text-xs text-muted-foreground">Permission appears only when needed.</p></div><Link2 className="size-5 text-blue-600" /></header>
            {!query.data.configured.google && <div className="border-b border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">Configure harness Google OAuth environment values first.</div>}
            {connectionItems.map(item => { const connected = capabilitySet.has(item.capability); const Icon = item.icon; return <div key={item.capability} className={styles.connectionRow}><span className={styles.iconWell}><Icon className="size-4" /></span><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{connected ? "Connected" : item.detail}</p></div>{connected ? <Check className="size-4 text-emerald-600" /> : <Button size="sm" variant="outline" disabled={!query.data.configured.google || busy === `connect-${item.capability}`} onClick={() => void connect(item.capability)}>Connect</Button>}</div>; })}
            {query.data.google && <div className="flex gap-2 border-t border-border p-4"><Button size="sm" variant="outline" disabled={!capabilitySet.has("SHEET_TRACKER")} onClick={() => void action("tracker", () => api.post("/harness/google/tracker", { name: "ProfileAI Job Tracker" }), "Tracker created")}>{query.data.tracker ? "Replace tracker" : "Create tracker"}</Button><Button size="sm" variant="ghost" onClick={() => void action("disconnect", () => api.delete("/harness/google"), "Google disconnected")}><Unplug className="mr-2 size-4" />Disconnect</Button></div>}
            {query.data.tracker?.externalUrl && <a className="flex items-center gap-2 border-t border-border p-4 text-xs font-semibold text-blue-600" href={query.data.tracker.externalUrl} target="_blank" rel="noreferrer">Open job tracker <ExternalLink className="size-3.5" /></a>}
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHeader}><div><h2 className="font-semibold">Browser companion</h2><p className="mt-1 text-xs text-muted-foreground">It opens search tabs and prepares approved application forms.</p></div><Bot className="size-5 text-blue-600" /></header>
            <div className="p-4"><div className={styles.companionGuide}><strong>Connect once</strong><span>Reload the unpacked extension, paste a fresh token, enable automatic tabs, then save.</span></div><Button className="mt-4 w-full" variant="outline" disabled={Boolean(busy)} onClick={() => void action("pair", async () => { const result = await api.post<{ token: string }>("/harness/browser/pair", { name: "My browser" }); setPairToken(result.token); }, "Pairing token created")}>Create fresh pairing token</Button>{pairToken && <><p className="mt-4 text-xs text-muted-foreground">Copy once. ProfileAI stores only its hash.</p><div className={`${styles.token} mt-2`}>{pairToken}</div><Button size="sm" variant="outline" className="mt-2" onClick={() => void navigator.clipboard.writeText(pairToken).then(() => toast.success("Pairing token copied"), () => toast.error("Select the token and copy it manually."))}><Copy className="mr-2 size-3.5" />Copy token</Button></>}{query.data.companions.map(companion => <div key={companion.id} className="mt-3 flex items-center justify-between border-t border-border pt-3"><div><p className="text-sm font-semibold">{companion.name}</p><p className="text-xs text-muted-foreground">{companion.lastSeenAt ? `Connected ${new Date(companion.lastSeenAt).toLocaleString()}` : "Token created, extension not connected"}</p></div><Button size="sm" variant="ghost" onClick={() => void action("revoke", () => api.delete(`/harness/browser/${companion.id}`))}>Revoke</Button></div>)}</div>
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHeader}><div><h2 className="font-semibold">Review queue</h2><p className="mt-1 text-xs text-muted-foreground">Unknown or sensitive fields stop here.</p></div><ShieldCheck className="size-5 text-emerald-600" /></header>
            {query.data.reviewTasks.length ? query.data.reviewTasks.slice(0, 8).map(task => <div className="border-t border-border p-4" key={task.id}><div className="flex items-center justify-between gap-2"><Badge variant="outline">{task.adapter}</Badge><span className="text-xs text-muted-foreground">{task.state}</span></div><p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{task.error ?? task.targetUrl}</p>{task.deviceId ? <Link href="/dashboard/worker" className="mt-3 inline-flex text-sm font-medium text-primary underline">Review in local worker</Link> : ["WAITING_FOR_USER", "BLOCKED"].includes(task.state) && <Button disabled={Boolean(busy)} className="mt-3" size="sm" onClick={() => void action("approve", () => api.post(`/harness/browser/tasks/${task.id}/approve`, {}), "Task approved")}>Approve retry</Button>}</div>) : <div className="p-5 text-xs leading-5 text-muted-foreground">No form needs review.</div>}
          </section>

          <section className={`${styles.panel} ${styles.safety}`}>
            <p className="font-semibold text-foreground">Permanent safety rules</p>
            <p className="mt-2">No password collection. No cookie upload. No CAPTCHA bypass. No invented experience. Demographic, disability, criminal-history, OTP, and legal-agreement fields always stop.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (value: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");
  const commit = (raw = input) => {
    const additions = raw.split(",").map(item => item.trim()).filter(Boolean);
    if (!additions.length) return;
    const next = [...value];
    for (const addition of additions) if (!next.some(item => item.toLowerCase() === addition.toLowerCase())) next.push(addition);
    onChange(next);
    setInput("");
  };
  return <div className={styles.tagInput} onClick={event => event.currentTarget.querySelector("input")?.focus()}>
    {value.map(item => <span className={styles.tag} key={item}>{item}<button type="button" aria-label={`Remove ${item}`} onClick={() => onChange(value.filter(current => current !== item))}>×</button></span>)}
    <input value={input} onChange={event => setInput(event.target.value)} onBlur={() => commit()} onKeyDown={event => { if (["Enter", ","].includes(event.key)) { event.preventDefault(); commit(); } else if (event.key === "Backspace" && !input && value.length) onChange(value.slice(0, -1)); }} placeholder={value.length ? "Add another" : placeholder} />
  </div>;
}

function Field({ label, full = false, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <label className={`${styles.label} ${full ? styles.full : ""}`}><span>{label}</span>{children}</label>;
}
