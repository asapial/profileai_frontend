import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-border p-6 text-center"><div><p className="font-semibold">{title}</p>{description ? <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p> : null}{action ? <div className="mt-4">{action}</div> : null}</div></div>;
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3" aria-label="Loading" role="status">{Array.from({ length: rows }, (_, index) => <div key={index} className="h-11 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />)}</div>;
}

export function ErrorState({ title = "Something went wrong", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4"><AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" /><div><p className="font-semibold">{title}</p>{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}{action ? <div className="mt-3">{action}</div> : null}</div></div>;
}
