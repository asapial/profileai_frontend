"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  CircleStop,
  Clock3,
  Copy,
  Fingerprint,
  KeyRound,
  Laptop,
  Loader2,
  MonitorCheck,
  Pause,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AutomationNavigation } from "@/components/dashboard/AutomationNavigation";
import { WorkerConsentPanel, type Consent } from "./WorkerConsentPanel";
import { WorkerInstructionPanel, type CapturedListing } from "./WorkerInstructionPanel";

type WorkerStatus = "ONLINE" | "OFFLINE" | "NOT_PAIRED";
type TaskState = "QUEUED" | "CLAIMED" | "OPENED" | "FILLED" | "WAITING_FOR_USER" | "PAUSED" | "TAKEOVER" | "COMPLETED" | "SUBMITTED" | "BLOCKED" | "FAILED" | "CANCELLED";
type ApprovalState = "PENDING" | "APPROVED" | "REJECTED" | "TAKEOVER" | "EXPIRED" | "REVOKED";

type Device = {
  id: string;
  name: string;
  platform: string;
  appVersion: string;
  publicKeyFingerprint: string;
  status: string;
  pairedAt: string;
  lastSeenAt: string | null;
  lastIp: string | null;
  online: boolean;
};

type Task = {
  id: string;
  jobId: string | null;
  runId: string | null;
  adapter: string;
  source: string;
  targetUrl: string;
  mode: string;
  state: TaskState;
  progress: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
  deviceId: string | null;
  job: { id: string; title: string; company: string; location: string | null } | null;
};

type Approval = {
  id: string;
  taskId: string;
  kind: string;
  state: ApprovalState;
  summary: string;
  targetUrl: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  evidence: unknown;
  requestedAt: string;
  expiresAt: string;
  decidedAt: string | null;
  expired: boolean;
};

type Policy = {
  source: string;
  name: string;
  version: string;
  level: "A" | "B" | "C";
  domains: unknown;
  discovery: boolean;
  search: boolean;
  scroll: boolean;
  extraction: boolean;
  formFill: boolean;
  submit: boolean;
  userPresenceRequired: boolean;
  maxPagesPerRun: number;
  maxRequestsPerMinute: number;
  reviewedAt: string;
  reviewReference: string;
  notes: string;
  enabled: boolean;
};

type Overview = {
  status: WorkerStatus;
  serverTime: string;
  summary: {
    devices: number;
    pendingApprovals: number;
    activeTasks: number;
    capturedListings: number;
    submissionsToday: number;
    policyCount: number;
  };
  devices: Device[];
  tasks: Task[];
  approvals: Approval[];
  events: Array<{ id: string; taskId: string; seq: number; type: string; message: string; createdAt: string }>;
  audits: Array<{ id: string; action: string; outcome: string; createdAt: string; metadata: unknown }>;
  policies: Policy[];
  consents: Consent[];
  capturedListings: CapturedListing[];
};

type PairingCode = { code: string; expiresAt: string; expiresInSeconds: number; deviceName?: string };

const TASK_LABEL: Record<TaskState, string> = {
  QUEUED: "Queued",
  CLAIMED: "Claimed",
  OPENED: "Opened",
  FILLED: "Filled",
  WAITING_FOR_USER: "Waiting for you",
  PAUSED: "Paused",
  TAKEOVER: "You have control",
  COMPLETED: "Completed",
  SUBMITTED: "Submitted",
  BLOCKED: "Blocked",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

const TASK_TONE: Record<TaskState, string> = {
  QUEUED: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
  CLAIMED: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
  OPENED: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300",
  FILLED: "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300",
  WAITING_FOR_USER: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  PAUSED: "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300",
  TAKEOVER: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  COMPLETED: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  SUBMITTED: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  BLOCKED: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
  FAILED: "bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300",
  CANCELLED: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300",
};

const LEVEL_TONE = {
  A: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  B: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  C: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300",
};

const RISK_TONE = {
  LOW: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
  HIGH: "bg-rose-500/10 text-rose-700 ring-rose-500/20",
};

const shortId = (value: string | null) => value ? value.slice(-8) : "unassigned";

function timeRemaining(expiresAt: string, now: number, prefix = "expires") {
  const seconds = Math.max(0, Math.floor((Date.parse(expiresAt) - now) / 1000));
  if (!Number.isFinite(seconds)) return "no expiry";
  if (seconds === 0) return "expired";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${prefix} ${minutes > 0 ? `${minutes}m ` : ""}${rest}s`;
}

function relative(value: string | null) {
  if (!value) return "Never";
  const diff = Math.max(0, Date.now() - Date.parse(value));
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function StatusPill({ status }: { status: WorkerStatus }) {
  const copy = status === "ONLINE" ? "Worker online" : status === "OFFLINE" ? "Worker offline" : "No worker paired";
  const Icon = status === "ONLINE" ? Wifi : status === "OFFLINE" ? WifiOff : Laptop;
  return (
    <span className={cn(
      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1",
      status === "ONLINE" ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300" : status === "OFFLINE" ? "bg-amber-500/10 text-amber-800 ring-amber-500/25 dark:text-amber-300" : "bg-muted text-muted-foreground ring-border",
    )}>
      <Icon className="size-3.5" /> {copy}
    </span>
  );
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/35 px-4 py-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{note}</p>
    </div>
  );
}

function Capability({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium", on ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground line-through decoration-1")}>
      {on ? <Check className="size-3" /> : <X className="size-3" />}{children}
    </span>
  );
}

export default function WorkerPage() {
  const queryClient = useQueryClient();
  const [pairing, setPairing] = useState<PairingCode | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [revokeTarget, setRevokeTarget] = useState<Device | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const overview = useQuery({
    queryKey: ["worker-overview"],
    queryFn: () => api.get<Overview>("/worker/overview"),
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["worker-overview"] });

  const createCode = useMutation({
    mutationFn: () => api.post<PairingCode>("/worker/pairing-code", {}),
    onSuccess: data => {
      setPairing(data);
      setNow(Date.now());
      toast.success("Pairing code ready. Enter it in the desktop worker.");
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revoke = useMutation({
    mutationFn: (deviceId: string) => api.delete<{ id: string }>(`/worker/devices/${deviceId}`),
    onSuccess: () => {
      setRevokeTarget(null);
      toast.success("Device revoked. Its sessions and pending approvals are invalid.");
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "APPROVED" | "REJECTED" | "TAKEOVER" }) =>
      api.post(`/worker/approvals/${id}/decision`, { decision, note: "" }),
    onSuccess: (_data, variables) => {
      toast.success(variables.decision === "APPROVED" ? "Approved. The worker may continue with this one action." : variables.decision === "TAKEOVER" ? "Takeover requested. The worker will stop acting." : "Rejected. The worker will not act.");
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const control = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "pause" | "resume" | "stop" | "takeover" | "handback" }) =>
      api.post(`/worker/tasks/${id}/control`, { action }),
    onSuccess: () => refresh(),
    onError: (error: Error) => toast.error(error.message),
  });

  const data = overview.data;
  const pending = data?.approvals.filter(approval => approval.state === "PENDING") ?? [];
  const paired = Boolean(data && data.status !== "NOT_PAIRED");
  const pairingSeconds = pairing ? Math.max(0, Math.floor((Date.parse(pairing.expiresAt) - now) / 1000)) : 0;

  const copyCode = async () => {
    if (!pairing) return;
    try {
      await navigator.clipboard.writeText(pairing.code);
      toast.success("Pairing code copied.");
    } catch {
      toast.error("Clipboard access was blocked. Select the code and copy it manually.");
    }
  };

  if (!data) return <div className="mx-auto max-w-[88rem] space-y-5 px-4 pb-14 lg:px-6">
    <AutomationNavigation current="worker" />
    <h1 className="text-3xl font-semibold tracking-tight">Local worker</h1>
    {overview.isError ? <div role="alert" className="rounded-2xl border border-destructive/25 bg-card p-6">
      <h2 className="font-semibold">Worker status could not be loaded</h2>
      <p className="mt-2 text-sm text-muted-foreground">{overview.error.message}</p>
      <Button className="mt-4" variant="outline" onClick={() => void overview.refetch()} disabled={overview.isFetching}><RefreshCw className="mr-2 size-4" />Retry</Button>
    </div> : <div role="status" aria-label="Loading worker workspace" className="space-y-4"><div className="h-48 animate-pulse rounded-2xl bg-muted" /><div className="h-80 animate-pulse rounded-2xl bg-muted" /></div>}
  </div>;

  return (
    <div className="mx-auto max-w-[88rem] space-y-6 px-4 pb-14 lg:px-6">
      <AutomationNavigation current="worker" />
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 text-foreground shadow-[var(--shadow-2)] sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-28 -top-56 size-[32rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Zap className="size-3" /> Local browser worker</span>
              <StatusPill status={data?.status ?? "NOT_PAIRED"} />
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-[-.03em] sm:text-[2.65rem] sm:leading-[1.08]">Your browser. Your control.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">Pair one Windows worker, queue a browser search only after granting per-source permission, and decide every submit from here. Passwords and browser cookies stay in the local vault, never in this account.</p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs leading-5 text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1"><ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-300" /> Human approval before submit</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1"><Fingerprint className="size-3.5 text-primary" /> Ed25519 device signing</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1"><KeyRound className="size-3.5 text-amber-700 dark:text-amber-300" /> Secrets never leave the vault</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Worker" value={data?.status === "ONLINE" ? "Ready" : data?.status === "OFFLINE" ? "Away" : "None"} note={data?.devices[0] ? `${data.devices[0].name} · ${relative(data.devices[0].lastSeenAt)}` : "Pair the desktop app"} />
            <Metric label="Active tasks" value={data?.summary.activeTasks ?? 0} note="Signed tasks in flight" />
            <Metric label="Waiting on you" value={data?.summary.pendingApprovals ?? 0} note="Actions never self-approve" />
            <Metric label="Captured" value={data?.summary.capturedListings ?? 0} note={`${data?.summary.submissionsToday ?? 0} submitted today`} />
          </div>
        </div>
      </section>

      {overview.isError ? (
        <Card className="border-rose-500/25 bg-rose-500/[.04]">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-5 text-rose-600" /><div><p className="font-semibold">Worker status could not be loaded</p><p className="mt-1 text-sm text-muted-foreground">{(overview.error as Error).message}</p></div></div>
            <Button variant="outline" onClick={() => void overview.refetch()}><RefreshCw className="mr-2 size-4" /> Retry</Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,.82fr)]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-primary/20">
            <CardContent className="p-0">
              <div className="flex flex-col gap-4 border-b border-border/70 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15"><Laptop className="size-5" /></span>
                  <div><h2 className="font-semibold tracking-tight">Connect a worker</h2><p className="mt-1 max-w-xl text-sm text-muted-foreground">Create a single-use code, or choose “Continue in browser” in the desktop app. You approve the device here before it can claim anything.</p></div>
                </div>
                <Button onClick={() => createCode.mutate()} disabled={createCode.isPending}>
                  {createCode.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}
                  {pairing ? "New code" : "Create pairing code"}
                </Button>
              </div>
              {pairing ? (
                <div className="grid min-w-0 gap-4 border-t border-border bg-muted/35 p-5">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">One-time pairing code</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="whitespace-nowrap font-mono text-2xl font-semibold tracking-[.12em] text-foreground sm:text-3xl">{pairing.code}</span>
                      <Button size="sm" variant="outline" disabled={pairingSeconds <= 0} onClick={() => void copyCode()}><Copy className="mr-2 size-3.5" /> Copy</Button>
                    </div>
                    <p className={cn("mt-2 text-xs", pairingSeconds > 0 ? "text-muted-foreground" : "text-rose-600 dark:text-rose-300")}>{pairingSeconds > 0 ? `Expires in ${Math.floor(pairingSeconds / 60)}m ${pairingSeconds % 60}s · single use` : "This code expired. Create a new one."}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2 font-medium text-foreground"><MonitorCheck className="size-4 text-emerald-600 dark:text-emerald-300" /> Then in the desktop app</p>
                    <p className="mt-1.5 leading-5">Open Setup → Pair this device, paste the code, and keep the same dedicated browser profile.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 bg-muted/30 p-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>{paired ? "Need another machine? Pairing a second worker is explicit and can be revoked independently." : "No pairing code yet. The worker cannot claim a task without one."}</span>
                  <span className="font-mono text-xs">Codes expire after 10 minutes</span>
                </div>
              )}
            </CardContent>
          </Card>

          {data ? <WorkerInstructionPanel consents={data.consents} listings={data.capturedListings} /> : null}

          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 p-5">
                <div><h2 className="font-semibold tracking-tight">Paired devices</h2><p className="mt-1 text-sm text-muted-foreground">Each device has its own key, session family, and revocation switch.</p></div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{data?.devices.length ?? 0}</span>
              </div>
              {overview.isLoading ? (
                <div className="grid min-h-36 place-items-center p-6 text-sm text-muted-foreground"><Loader2 className="mb-2 size-5 animate-spin" /> Loading devices…</div>
              ) : data?.devices.length ? (
                <ul className="divide-y divide-border/70">
                  {data.devices.map(device => (
                    <li key={device.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ring-1", device.online ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20" : "bg-muted text-muted-foreground ring-border")}><Laptop className="size-4" /></span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><p className="truncate font-medium">{device.name}</p><span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1", device.online ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300" : "bg-muted text-muted-foreground ring-border")}><span className={cn("size-1.5 rounded-full", device.online ? "bg-emerald-500" : "bg-muted-foreground")} />{device.online ? "Online" : "Offline"}</span></div>
                          <p className="mt-1 text-xs text-muted-foreground">{device.platform} · app {device.appVersion} · paired {relative(device.pairedAt)} · seen {relative(device.lastSeenAt)}</p>
                          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">key {device.publicKeyFingerprint.slice(0, 24)}… · id {shortId(device.id)}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-700" onClick={() => setRevokeTarget(device)}><Trash2 className="mr-2 size-3.5" /> Revoke</Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid min-h-40 place-items-center p-6 text-center"><div><Laptop className="mx-auto size-6 text-muted-foreground" /><p className="mt-2 text-sm font-medium">No worker paired yet</p><p className="mt-1 text-xs text-muted-foreground">Create a code above, then finish setup in the desktop app.</p></div></div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 p-5">
                <div><h2 className="font-semibold tracking-tight">Recent task queue</h2><p className="mt-1 text-sm text-muted-foreground">The worker only receives signed, scoped tasks. Stop or pause any active run.</p></div>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Activity className="size-3.5" /> Refreshes every 5s</span>
              </div>
              {data?.tasks.length ? (
                <ul className="divide-y divide-border/70">
                  {data.tasks.slice(0, 8).map(task => {
                    const active = ["QUEUED", "CLAIMED", "OPENED", "FILLED", "WAITING_FOR_USER", "PAUSED", "TAKEOVER", "BLOCKED"].includes(task.state);
                    return (
                      <li key={task.id} className="p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium ring-1", TASK_TONE[task.state])}>{TASK_LABEL[task.state]}</span>
                              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{task.source.replaceAll("_", " ")}</span>
                              <span className="text-xs text-muted-foreground">updated {relative(task.updatedAt)}</span>
                            </div>
                            <p className="mt-2 truncate font-medium">{task.job ? `${task.job.title} · ${task.job.company}` : task.targetUrl}</p>
                            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{task.targetUrl}</p>
                            {task.error ? <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" />{task.error}</p> : null}
                            <div className="mt-3 max-w-md"><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", task.state === "SUBMITTED" || task.state === "COMPLETED" ? "bg-emerald-500" : task.state === "BLOCKED" || task.state === "FAILED" ? "bg-rose-500" : "bg-primary")} style={{ width: `${Math.max(2, task.progress)}%` }} /></div></div>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {task.state === "TAKEOVER" ? <Button size="sm" variant="outline" disabled={control.isPending} onClick={() => control.mutate({ id: task.id, action: "handback" })}><Play className="mr-1.5 size-3.5" />Hand back</Button> : task.state === "PAUSED" ? <Button size="sm" variant="outline" disabled={control.isPending} onClick={() => control.mutate({ id: task.id, action: "resume" })}><Play className="mr-1.5 size-3.5" /> Resume</Button> : active && task.state !== "BLOCKED" ? <Button size="sm" variant="outline" disabled={control.isPending} onClick={() => control.mutate({ id: task.id, action: "pause" })}><Pause className="mr-1.5 size-3.5" /> Pause</Button> : null}
                            {active ? <Button size="sm" variant="outline" disabled={control.isPending} onClick={() => control.mutate({ id: task.id, action: "stop" })} className="text-rose-600 hover:bg-rose-500/5 hover:text-rose-700"><CircleStop className="mr-1.5 size-3.5" /> Stop</Button> : null}
                            {task.runId ? <Link href="/dashboard/harness" className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted">Open harness</Link> : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="grid min-h-40 place-items-center p-6 text-center"><div><Activity className="mx-auto size-6 text-muted-foreground" /><p className="mt-2 text-sm font-medium">The queue is clear</p><p className="mt-1 text-xs text-muted-foreground">Use Browser instructions above, or start a harness run in Draft or Assisted mode.</p><Link href="/dashboard/harness" className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">Open harness <span aria-hidden>→</span></Link></div></div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={cn("overflow-hidden", pending.length ? "border-amber-500/35" : "")}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 p-5">
                <div><h2 className="flex items-center gap-2 font-semibold tracking-tight"><ShieldAlert className={cn("size-4", pending.length ? "text-amber-600" : "text-muted-foreground")} /> Waiting on you</h2><p className="mt-1 text-sm text-muted-foreground">Approvals are single-action and expire.</p></div>
                <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", pending.length ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground")}>{pending.length}</span>
              </div>
              {pending.length ? (
                <ul className="divide-y divide-border/70">
                  {pending.map(approval => {
                    const expired = approval.expired || Date.parse(approval.expiresAt) <= now;
                    return (
                      <li key={approval.id} className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-2.5"><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"><ShieldAlert className="size-4" /></span><div><div className="flex flex-wrap items-center gap-1.5"><span className="text-xs font-semibold text-muted-foreground">{approval.kind.replaceAll("_", " ")}</span><span className={cn("rounded px-1.5 py-0.5 text-xs font-semibold ring-1", RISK_TONE[approval.risk])}>{approval.risk}</span></div><p className="mt-1 text-sm leading-5">{approval.summary}</p></div></div>
                          <span className={cn("shrink-0 text-xs font-medium", expired ? "text-rose-600 dark:text-rose-300" : "text-muted-foreground")}>{timeRemaining(approval.expiresAt, now)}</span>
                        </div>
                        {approval.targetUrl ? <a href={approval.targetUrl} target="_blank" rel="noreferrer" className="mt-2 block truncate font-mono text-xs text-primary hover:underline">{approval.targetUrl}</a> : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={expired || decide.isPending} onClick={() => decide.mutate({ id: approval.id, decision: "APPROVED" })}><Check className="mr-1.5 size-3.5" /> Approve once</Button>
                          <Button size="sm" variant="outline" disabled={expired || decide.isPending} onClick={() => decide.mutate({ id: approval.id, decision: "TAKEOVER" })}><MonitorCheck className="mr-1.5 size-3.5" /> Take over</Button>
                          <Button size="sm" variant="ghost" disabled={expired || decide.isPending} onClick={() => decide.mutate({ id: approval.id, decision: "REJECTED" })}><X className="mr-1.5 size-3.5" /> Reject</Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="grid min-h-40 place-items-center p-6 text-center"><div><CheckCircle2 className="mx-auto size-6 text-emerald-600" /><p className="mt-2 text-sm font-medium">Nothing is waiting</p><p className="mt-1 text-xs text-muted-foreground">The worker will pause here before a submit, login, upload, or sensitive field.</p></div></div>
              )}
            </CardContent>
          </Card>

          <div id="browser-permissions" className="scroll-mt-24">
            {data ? <WorkerConsentPanel consents={data.consents} /> : null}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="border-b border-border/70 p-5"><h2 className="flex items-center gap-2 font-semibold tracking-tight"><ShieldCheck className="size-4 text-emerald-600" /> Source safety matrix</h2><p className="mt-1 text-sm text-muted-foreground">Capabilities are enforced by the worker and independently rechecked by the API.</p></div>
              {overview.isLoading ? <div className="grid min-h-32 place-items-center p-5 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px] text-left text-xs">
                    <thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-4 py-2.5 font-semibold">Source</th><th className="px-3 py-2.5 font-semibold">Level</th><th className="px-3 py-2.5 font-semibold">Search</th><th className="px-3 py-2.5 font-semibold">Scroll</th><th className="px-3 py-2.5 font-semibold">Capture</th><th className="px-3 py-2.5 font-semibold">Fill</th><th className="px-3 py-2.5 font-semibold">Submit</th></tr></thead>
                    <tbody className="divide-y divide-border/60">
                      {data?.policies.map(policy => (
                        <tr key={policy.source} className="align-top">
                          <td className="px-4 py-3"><p className="font-medium">{policy.name}</p><p className="mt-0.5 font-mono text-xs text-muted-foreground">{policy.version}</p></td>
                          <td className="px-3 py-3"><span className={cn("inline-flex rounded px-1.5 py-0.5 font-bold ring-1", LEVEL_TONE[policy.level])}>{policy.level}</span></td>
                          <td className="px-3 py-3"><Capability on={policy.search}>Search</Capability></td>
                          <td className="px-3 py-3"><Capability on={policy.scroll}>Scroll</Capability></td>
                          <td className="px-3 py-3"><Capability on={policy.extraction}>Capture</Capability></td>
                          <td className="px-3 py-3"><Capability on={policy.formFill}>Fill</Capability></td>
                          <td className="px-3 py-3"><Capability on={policy.submit}>Submit</Capability></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="border-t border-border/70 bg-muted/20 px-5 py-3 text-xs leading-5 text-muted-foreground">Search and scrolling require the per-source permission above and are never enabled by default. LinkedIn applications stay manual handoff; Facebook capture is visible-page only. No policy in this workspace enables auto-submit.</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="flex items-center gap-2 font-semibold tracking-tight"><Clock3 className="size-4 text-muted-foreground" /> Latest audit</h2>
              <ul className="mt-3 space-y-2.5">
                {(data?.audits.slice(0, 5) ?? []).map(entry => (
                  <li key={entry.id} className="flex items-start gap-2 text-xs"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" /><div className="min-w-0"><p className="truncate font-medium">{entry.action.replaceAll("_", " ").toLowerCase()}</p><p className="text-xs text-muted-foreground">{relative(entry.createdAt)} · {entry.outcome.toLowerCase()}</p></div></li>
                ))}
                {!data?.audits.length ? <li className="text-xs text-muted-foreground">No worker audit events yet.</li> : null}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {revokeTarget ? (
        <DialogPrimitive.Root open onOpenChange={open => { if (!open && !revoke.isPending) setRevokeTarget(null); }}>
          <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm" /><DialogPrimitive.Content aria-labelledby="revoke-title" className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-background p-6 shadow-2xl">
            <span className="grid size-11 place-items-center rounded-2xl bg-rose-500/10 text-rose-600"><ShieldAlert className="size-5" /></span>
            <DialogPrimitive.Title asChild><h2 id="revoke-title" className="mt-4 text-xl font-semibold tracking-tight">Revoke {revokeTarget.name}?</h2></DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted-foreground">Every access and refresh token for this device is invalidated immediately. Pending approvals are cancelled. Local browser cookies and vault secrets stay on the machine until you clear them in the desktop app.</DialogPrimitive.Description>
            <div className="mt-5 rounded-xl border border-rose-500/15 bg-rose-500/[.04] px-3 py-2 font-mono text-xs text-muted-foreground">{revokeTarget.publicKeyFingerprint.slice(0, 36)}…</div>
            <div className="mt-6 flex justify-end gap-2"><Button variant="ghost" disabled={revoke.isPending} onClick={() => setRevokeTarget(null)}>Cancel</Button><Button className="bg-rose-600 text-white hover:bg-rose-700" disabled={revoke.isPending} onClick={() => revoke.mutate(revokeTarget.id)}>{revoke.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />} Revoke device</Button></div>
          </DialogPrimitive.Content></DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      ) : null}
    </div>
  );
}
