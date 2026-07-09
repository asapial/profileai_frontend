"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Download,
  FileDown,
  Loader2,
  PackageOpen,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useExportJobList,
  useRequestUserExport,
  type ExportJob,
  type ExportJobKind,
  type ExportJobStatus,
} from "@/lib/hooks/useExports";

const KIND_LABEL: Record<ExportJobKind, string> = {
  USER_DATA: "Account data",
  RESUME_PDF: "Resume PDF",
  COVER_LETTER_PDF: "Cover letter PDF",
};

const STATUS_LABEL: Record<ExportJobStatus, string> = {
  PENDING: "Queued",
  RUNNING: "Running",
  DONE: "Ready",
  FAILED: "Failed",
};

const STATUS_TONE: Record<ExportJobStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  RUNNING: "bg-violet-100 text-violet-700",
  DONE: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
};

export default function ExportsPage() {
  const [status, setStatus] = useState<ExportJobStatus | "ALL">("ALL");

  const { data, isLoading, isFetching } = useExportJobList({ limit: 50 });
  const requestExport = useRequestUserExport();

  const allJobs = data ?? [];
  const jobs =
    status === "ALL" ? allJobs : allJobs.filter((j) => j.status === status);

  const inflightCount = allJobs.filter(
    (j) => j.status === "PENDING" || j.status === "RUNNING"
  ).length;

  function handleRequest() {
    requestExport.mutate(undefined, {
      onSuccess: (job) => {
        toast.success("Export queued. This may take a moment.");
        // Keep the user oriented.
        toast(
          `Job ${job.id.slice(0, 8)} started in ${KIND_LABEL[job.kind]}.`,
          { icon: "📦" }
        );
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Export failed."),
    });
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Exports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Download a copy of your account data, or pick up PDF exports of
            your resumes and cover letters here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleRequest}
            disabled={requestExport.isPending}
            className="gap-2"
          >
            {requestExport.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Request account data
          </Button>
        </div>
      </header>

      {inflightCount > 0 ? (
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-violet-900">
            <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
            <span>
              {inflightCount} export{inflightCount === 1 ? "" : "s"} in
              progress — this page auto-refreshes every few seconds.
            </span>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Export history</CardTitle>
            <div className="text-xs text-muted-foreground">
              {data ? `${allJobs.length} ${allJobs.length === 1 ? "job" : "jobs"}` : " "}
              {isFetching ? (
                <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />
              ) : null}
            </div>
          </div>
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as ExportJobStatus | "ALL")}
            options={[
              { value: "ALL", label: "All statuses" },
              { value: "PENDING", label: "Queued" },
              { value: "RUNNING", label: "Running" },
              { value: "DONE", label: "Ready" },
              { value: "FAILED", label: "Failed" },
            ]}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl border border-border bg-muted/40"
                />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              hasFilters={status !== "ALL"}
              onRequest={handleRequest}
              onClearFilters={() => setStatus("ALL")}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl border border-border md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Kind</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">Requested</th>
                      <th className="px-4 py-2 text-left font-medium">Completed</th>
                      <th className="px-4 py-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {jobs.map((job) => (
                      <ExportRow key={job.id} job={job} />
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="space-y-2 md:hidden">
                {jobs.map((job) => (
                  <MobileExportRow key={job.id} job={job} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="sr-only sm:not-sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-background px-2 py-1.5 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: ExportJobStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_TONE[status]}`}
    >
      {status === "RUNNING" || status === "PENDING" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : status === "DONE" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : status === "FAILED" ? (
        <XCircle className="h-3 w-3" />
      ) : null}
      {STATUS_LABEL[status]}
    </span>
  );
}

function ExportRow({ job }: { job: ExportJob }) {
  return (
    <tr className="bg-background">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <PackageOpen className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{KIND_LABEL[job.kind]}</span>
        </div>
        {job.errorMsg ? (
          <p className="mt-1 text-[11px] text-rose-600">{job.errorMsg}</p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {formatDateTime(job.createdAt)}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {job.completedAt ? formatDateTime(job.completedAt) : "—"}
      </td>
      <td className="px-4 py-3 text-right">
        {job.status === "DONE" && job.resultUrl ? (
          <Button asChild size="sm" variant="outline" className="gap-1">
            <a
              href={job.resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          </Button>
        ) : job.status === "FAILED" ? (
          <span className="text-xs text-rose-600">No file</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}

function MobileExportRow({ job }: { job: ExportJob }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
            {KIND_LABEL[job.kind]}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {formatDateTime(job.createdAt)}
          </div>
        </div>
        <StatusBadge status={job.status} />
      </div>
      {job.errorMsg ? (
        <p className="mt-2 text-[11px] text-rose-600">{job.errorMsg}</p>
      ) : null}
      <div className="mt-3 flex items-center justify-end">
        {job.status === "DONE" && job.resultUrl ? (
          <Button asChild size="sm" variant="outline" className="gap-1">
            <a href={job.resultUrl} target="_blank" rel="noopener noreferrer" download>
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onRequest,
  onClearFilters,
}: {
  hasFilters: boolean;
  onRequest: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
      <PackageOpen className="h-8 w-8 text-violet-500" />
      <h3 className="mt-3 text-base font-semibold">
        {hasFilters ? "No exports match" : "No exports yet"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Try clearing your status filter."
          : "Export your account data, or generate PDFs from your resumes and cover letters."}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {hasFilters ? (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : (
          <Button size="sm" onClick={onRequest} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Request account data
          </Button>
        )}
      </div>
    </div>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}