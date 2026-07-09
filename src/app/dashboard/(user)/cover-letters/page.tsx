"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
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
  useCoverLetterList,
  useCreateCoverLetter,
  useDeleteCoverLetter,
  useExportCoverLetter,
  useRegenerateCoverLetter,
  type CoverLetterItem,
  type CoverLetterStatus,
} from "@/lib/hooks/useCoverLetters";
import { useResumeList } from "@/lib/hooks/useResumes";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";

const STATUS_LABEL: Record<CoverLetterStatus, string> = {
  DRAFT: "Draft",
  GENERATED: "Generated",
  EXPORTED: "Exported",
};

const STATUS_TONE: Record<CoverLetterStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-700",
  GENERATED: "bg-violet-100 text-violet-700",
  EXPORTED: "bg-emerald-100 text-emerald-700",
};

export default function CoverLettersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<CoverLetterStatus | "ALL">("ALL");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Debounce search.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useCoverLetterList({
    limit: 50,
    search: debouncedSearch || undefined,
  });

  const { data: dashboard } = useDashboardSummary();
  const apiUsed = dashboard?.limits?.apiUsed ?? 0;
  const apiLimit = dashboard?.limits?.apiLimit ?? 0;
  const limitReached = apiLimit > 0 && apiUsed >= apiLimit;

  const allItems = data?.items ?? [];
  const items =
    status === "ALL" ? allItems : allItems.filter((it) => it.status === status);

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Cover letters
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage AI-generated and hand-written cover letters, regenerate with
            new job descriptions, or export to PDF.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setCreating(true)}
            disabled={limitReached}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {limitReached ? "AI limit reached" : "New cover letter"}
          </Button>
        </div>
      </header>

      {limitReached ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-amber-900">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>
              You&apos;ve used all AI calls in your current plan. Regenerate
              will be disabled until your quota resets.
            </span>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All cover letters</CardTitle>
            <div className="text-xs text-muted-foreground">
              {data ? `${allItems.length} ${allItems.length === 1 ? "letter" : "letters"}` : " "}
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
                placeholder="Search by title, company, or role"
                className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              />
            </div>
            <FilterSelect
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as CoverLetterStatus | "ALL")}
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
          ) : items.length === 0 ? (
            <EmptyState
              hasFilters={Boolean(debouncedSearch || status !== "ALL")}
              onCreate={() => setCreating(true)}
              onClearFilters={() => {
                setSearch("");
                setStatus("ALL");
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((letter) => (
                <CoverLetterCard
                  key={letter.id}
                  letter={letter}
                  isMenuOpen={openMenu === letter.id}
                  onToggleMenu={(id) =>
                    setOpenMenu((cur) => (cur === id ? null : id))
                  }
                  onMenuClose={() => setOpenMenu(null)}
                  aiLimitReached={limitReached}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {creating ? (
        <NewCoverLetterDialog
          onClose={() => setCreating(false)}
          onCreated={(created) => {
            setCreating(false);
            router.push(`/cover-letters/${created.id}`);
          }}
        />
      ) : null}
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

function CoverLetterCard({
  letter,
  isMenuOpen,
  onToggleMenu,
  onMenuClose,
  aiLimitReached,
}: {
  letter: CoverLetterItem;
  isMenuOpen: boolean;
  onToggleMenu: (id: string) => void;
  onMenuClose: () => void;
  aiLimitReached: boolean;
}) {
  const remove = useDeleteCoverLetter();
  const exportMut = useExportCoverLetter();
  const regenerate = useRegenerateCoverLetter();

  async function handleRegenerate() {
    onMenuClose();
    const jobDescription = window.prompt(
      "Paste the job description to regenerate this cover letter for:",
      ""
    );
    if (!jobDescription || jobDescription.trim().length < 20) {
      toast.error("Job description must be at least 20 characters.");
      return;
    }
    regenerate.mutate(
      { id: letter.id, jobDescription: jobDescription.trim() },
      {
        onSuccess: () => toast.success("Cover letter regenerated."),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Regenerate failed."
          ),
      }
    );
  }

  async function handleExport() {
    onMenuClose();
    try {
      await exportMut.mutateAsync(letter.id);
      toast.success("Export queued. Track it in /dashboard/exports.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    }
  }

  function handleDelete() {
    onMenuClose();
    const ok = window.confirm(
      `Delete "${letter.title}"? This cannot be undone.`
    );
    if (!ok) return;
    remove.mutate(letter.id, {
      onSuccess: () => toast.success("Cover letter deleted."),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Delete failed."),
    });
  }

  return (
    <Card className="group relative flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/cover-letters/${letter.id}`}
            className="block flex-1 hover:underline"
          >
            <CardTitle className="line-clamp-1 text-base">{letter.title}</CardTitle>
            <CardDescription className="line-clamp-1 text-xs">
              {letter.targetJobTitle ?? "No target role set"}
              {letter.targetCompany ? ` · ${letter.targetCompany}` : ""}
            </CardDescription>
          </Link>
          <div className="relative shrink-0">
            <button
              type="button"
              aria-label="Cover letter actions"
              onClick={(e) => {
                e.preventDefault();
                onToggleMenu(letter.id);
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
                <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={regenerate.isPending || aiLimitReached}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Regenerate with AI
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
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_TONE[letter.status]}`}
          >
            {STATUS_LABEL[letter.status]}
          </span>
          {letter.resume ? (
            <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
              {letter.resume.title}
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Updated {formatRelative(letter.updatedAt)}</span>
          <Link
            href={`/cover-letters/${letter.id}`}
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
      <FileText className="h-8 w-8 text-violet-500" />
      <h3 className="mt-3 text-base font-semibold">
        {hasFilters ? "No cover letters match" : "No cover letters yet"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Try clearing your filters or adjusting your search."
          : "Generate your first cover letter with AI in under a minute."}
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

function NewCoverLetterDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (created: CoverLetterItem) => void;
}) {
  const { data: resumeList, isLoading: resumesLoading } = useResumeList({
    limit: 100,
    status: "GENERATED",
  });
  const create = useCreateCoverLetter();

  const [resumeId, setResumeId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [targetJobTitle, setTargetJobTitle] = useState<string>("");
  const [targetCompany, setTargetCompany] = useState<string>("");

  // Fall back to the first available resume whenever the user hasn't picked
  // one — keeps the form submittable without forcing a redundant effect.
  const resumes = resumeList?.resumes ?? [];
  const effectiveResumeId = resumeId || resumes[0]?.id || "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveResumeId) {
      toast.error("Pick a resume to attach this cover letter to.");
      return;
    }
    if (!title.trim()) {
      toast.error("Give the cover letter a title.");
      return;
    }
    create.mutate(
      {
        resumeId: effectiveResumeId,
        title: title.trim(),
        targetJobTitle: targetJobTitle.trim() || undefined,
        targetCompany: targetCompany.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          toast.success("Cover letter created.");
          onCreated(data);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Create failed."),
      }
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">New cover letter</h2>
            <p className="text-xs text-muted-foreground">
              Attach a cover letter to one of your generated resumes. You can
              regenerate it with a job description afterwards.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            ×
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Resume
            </label>
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              disabled={resumesLoading}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            >
              {resumesLoading ? (
                <option>Loading…</option>
              ) : resumes.length === 0 ? (
                <option value="">No generated resumes available</option>
              ) : (
                resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                    {r.targetJobTitle ? ` — ${r.targetJobTitle}` : ""}
                  </option>
                ))
              )}
            </select>
            {resumes.length === 0 && !resumesLoading ? (
              <p className="text-[11px] text-amber-700">
                Generate a resume first to enable cover letters.
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer — Acme"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Target role (optional)
              </label>
              <input
                value={targetJobTitle}
                onChange={(e) => setTargetJobTitle(e.target.value)}
                placeholder="Senior Frontend Engineer"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Company (optional)
              </label>
              <input
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="Acme Inc."
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={create.isPending || resumes.length === 0}
              className="gap-2"
            >
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Create
            </Button>
          </div>
        </form>
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