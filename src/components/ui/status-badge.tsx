import {
  CheckCircle2,
  CircleDot,
  Clock3,
  Download,
  FileEdit,
  type LucideIcon,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; tone: string; Icon: LucideIcon }> = {
  DRAFT: { label: "Draft", tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-200", Icon: FileEdit },
  GENERATED: { label: "Generated", tone: "bg-violet-100 text-violet-800 dark:bg-violet-950/45 dark:text-violet-200", Icon: CircleDot },
  EXPORTED: { label: "Exported", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-200", Icon: Download },
  SAVED: { label: "Saved", tone: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200", Icon: FileEdit },
  PREPARING: { label: "Preparing", tone: "bg-violet-100 text-violet-800 dark:bg-violet-950/45 dark:text-violet-200", Icon: Clock3 },
  APPLIED: { label: "Applied", tone: "bg-violet-100 text-violet-800 dark:bg-violet-950/45 dark:text-violet-200", Icon: CheckCircle2 },
  FOLLOW_UP_DUE: { label: "Follow-up due", tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-200", Icon: Clock3 },
  RECRUITER_SCREEN: { label: "Recruiter screen", tone: "bg-sky-100 text-sky-800 dark:bg-sky-950/45 dark:text-sky-200", Icon: CircleDot },
  INTERVIEW: { label: "Interview", tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/45 dark:text-amber-200", Icon: CircleDot },
  ASSESSMENT: { label: "Assessment", tone: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/45 dark:text-indigo-200", Icon: CircleDot },
  OFFER: { label: "Offer", tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-200", Icon: CheckCircle2 },
  REJECTED: { label: "Rejected", tone: "bg-rose-100 text-rose-800 dark:bg-rose-950/45 dark:text-rose-200", Icon: XCircle },
  WITHDRAWN: { label: "Withdrawn", tone: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200", Icon: XCircle },
};

function fallbackLabel(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status] ?? {
    label: fallbackLabel(status),
    tone: "bg-muted text-muted-foreground",
    Icon: CircleDot,
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold", meta.tone, className)}>
      <meta.Icon className="size-3" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
