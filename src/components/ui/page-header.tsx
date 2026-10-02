import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, action, overflow, className }: { eyebrow?: string; title: string; description?: string; action?: ReactNode; overflow?: ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-2 text-xs font-semibold text-primary">{eyebrow}</p> : null}
        <h1 tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {(action || overflow) ? <div className="flex shrink-0 items-center gap-2">{action}{overflow}</div> : null}
    </header>
  );
}
