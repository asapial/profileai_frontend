import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div data-ui="empty-state" className="grid min-h-52 place-items-center rounded-[var(--radius-card)] border border-dashed border-border bg-muted/25 p-6 text-center"><div><span className="mx-auto grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Inbox className="size-5" aria-hidden="true" /></span><p className="mt-4 font-semibold">{title}</p>{description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}{action ? <div className="mt-5">{action}</div> : null}</div></div>;
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return <div data-ui="loading-state" className="space-y-3" aria-label="Loading" role="status">{Array.from({ length: rows }, (_, index) => <div key={index} className="h-12 animate-pulse rounded-[var(--radius-control)] bg-muted motion-reduce:animate-none" />)}</div>;
}

export function ErrorState({ title = "Something went wrong", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div data-ui="error-state" role="alert" className="flex items-start gap-3 rounded-[var(--radius-card)] border border-destructive/30 bg-destructive/5 p-4"><AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" /><div><p className="font-semibold">{title}</p>{description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}{action ? <div className="mt-4">{action}</div> : null}</div></div>;
}
