"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Copy,
  Download,
  FileText,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useDeleteResume,
  useDuplicateResume,
  useExportResume,
  useResumeList,
  type ResumeListItem,
  type ResumeStatus,
  type ResumeType,
} from "@/lib/hooks/useResumes";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";

const STATUS_LABEL: Record<ResumeStatus, string> = {
  DRAFT: "Draft",
  GENERATED: "Generated",
  EXPORTED: "Exported",
};

const STATUS_TONE: Record<ResumeStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-700",
  GENERATED: "bg-violet-100 text-violet-700",
  EXPORTED: "bg-emerald-100 text-emerald-700",
};

const PAGE_SIZE = 9;

export default function ResumesListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState<ResumeType | "ALL">("ALL");
  const [status, setStatus] = useState<ResumeStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Debounce search so we don't hammer the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to first page on filter changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, type, status]);

  const { data, isLoading, isFetching } = useResumeList({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    type: type === "ALL" ? undefined : type,
    status: status === "ALL" ? undefined : status,
  });

  const { data: dashboard } = useDashboardSummary();

  const resumes = data?.resumes ?? [];
  const meta = data?.meta;

  const limitReached = useMemo(() => {
    const limits = dashboard?.limits;
    if (!limits) return false;
    return limits.resumeUsed >= limits.resumeLimit;
  }, [dashboard?.limits]);

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            My resumes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a resume to keep editing, or start a new AI-generated draft.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1">
            <Link href="/templates">
              <FileText className="h-4 w-4" /> Browse templates
            </Link>
          </Button>
          <Button
            onClick={() => router.push("/resume/create")}
            disabled={limitReached}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {limitReached ? "Limit reached" : "New resume"}
          </Button>
        </div>
      </header>

      {limitReached ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-amber-900">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>
              You&apos;ve used all resumes in your current plan. Upgrade to
              keep generating.
            </span>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All resumes</CardTitle>
            <div className="text-xs text-muted-foreground">
              {meta
                ? `${meta.total} ${meta.total === 1 ? "resume" : "resumes"}`
                : " "}
              {isFetching ? (
                <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or role"
                className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              />
            </div>
            <FilterSelect
              label="Type"
              value={type}
              onChange={(v) => setType(v as ResumeType | "ALL")}
              options={[
                { value: "ALL", label: "All types" },
                { value: "RESUME", label: "Resume" },
                { value: "CV", label: "CV" },
              ]}
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as ResumeStatus | "ALL")}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "DRAFT", label: "Draft" },
                { value: "GENERATED", label: "Generated" },
                { value: "EXPORTED", label: "Exported" },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40"
                />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <EmptyState
              hasFilters={Boolean(
                debouncedSearch || type !== "ALL" || status !== "ALL"
              )}
              onCreate={() => router.push("/resume/create")}
              onClearFilters={() => {
                setSearch("");
                setType("ALL");
                setStatus("ALL");
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resumes.map((r) => (
                <ResumeCard
                  key={r.id}
                  resume={r}
                  isMenuOpen={openMenu === r.id}
                  onToggleMenu={(id) =>
                    setOpenMenu((cur) => (cur === id ? null : id))
                  }
                  onMenuClose={() => setOpenMenu(null)}
                />
              ))}
            </div>
          )}

          {meta && meta.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {meta.page} of {meta.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
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

function ResumeCard({
  resume,
  isMenuOpen,
  onToggleMenu,
  onMenuClose,
}: {
  resume: ResumeListItem;
  isMenuOpen: boolean;
  onToggleMenu: (id: string) => void;
  onMenuClose: () => void;
}) {
  const router = useRouter();
  const duplicate = useDuplicateResume();
  const remove = useDeleteResume();
  const exportMut = useExportResume();

  async function handleDuplicate() {
    onMenuClose();
    duplicate.mutate(resume.id, {
      onSuccess: (data) => {
        toast.success("Duplicated.");
        router.push(`/resume/${data.id}/edit`);
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Duplicate failed."),
    });
  }

  async function handleExport() {
    onMenuClose();
    try {
      const res = await exportMut.mutateAsync({ id: resume.id });
      if (res.presignedUrl) {
        window.open(res.presignedUrl, "_blank", "noopener");
        toast.success("Export ready. Opening PDF…");
        return;
      }
      if (res.jobId) {
        toast.success("Export queued.");
        return;
      }
      toast.error("Export did not return a URL.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    }
  }

  function handleDelete() {
    onMenuClose();
    const ok = window.confirm(`Delete "${resume.title}"? This cannot be undone.`);
    if (!ok) return;
    remove.mutate(resume.id, {
      onSuccess: () => toast.success("Resume deleted."),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Delete failed."),
    });
  }

  return (
    <Card className="group relative flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/resume/${resume.id}/edit`}
            className="block flex-1 hover:underline"
          >
            <CardTitle className="line-clamp-1 text-base">{resume.title}</CardTitle>
            <CardDescription className="line-clamp-1 text-xs">
              {resume.targetJobTitle ?? "No target role set"}
            </CardDescription>
          </Link>
          <div className="relative shrink-0">
            <button
              type="button"
              aria-label="Resume actions"
              onClick={(e) => {
                e.preventDefault();
                onToggleMenu(resume.id);
              }}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {isMenuOpen ? (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={onMenuClose}
                  aria-hidden
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
                  <button
                    type="button"
                    onClick={handleDuplicate}
                    disabled={duplicate.isPending}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted disabled:opacity-50"
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exportMut.isPending}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" /> Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={remove.isPending}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
              STATUS_TONE[resume.status]
            }`}
          >
            {STATUS_LABEL[resume.status]}
          </span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
            {resume.type}
          </span>
          {resume.template?.name ? (
            <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
              {resume.template.name}
            </span>
          ) : null}
          {resume.atsScore != null ? (
            <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              ATS {resume.atsScore}
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Updated {formatRelative(resume.updatedAt)}</span>
          <Link
            href={`/resume/${resume.id}/edit`}
            className="font-medium text-violet-700 hover:underline"
          >
            Open →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  hasFilters,
  onCreate,
  onClearFilters,
}: {
  hasFilters: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
      <Sparkles className="h-8 w-8 text-violet-500" />
      <h3 className="mt-3 text-base font-semibold">
        {hasFilters ? "No resumes match" : "No resumes yet"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Try clearing your filters or adjusting your search."
          : "Generate your first resume with AI in under a minute."}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {hasFilters ? (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : (
          <Button size="sm" onClick={onCreate} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Create with AI
          </Button>
        )}
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "recently";
  const diff = Date.now() - then;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.round(diff / minute)}m ago`;
  if (diff < day) return `${Math.round(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.round(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString();
}