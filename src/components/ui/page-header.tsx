import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  overflow,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  overflow?: ReactNode;
  className?: string;
}) {
  return (
    <header
      data-ui="page-header"
      className={cn(
        "flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-sm font-semibold text-primary">{eyebrow}</p>
        ) : null}
        <h1
          tabIndex={-1}
          className="text-3xl font-semibold leading-tight tracking-[-0.035em] outline-none sm:text-4xl"
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-[var(--measure-copy)] text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action || overflow ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {action}
          {overflow}
        </div>
      ) : null}
    </header>
  );
}
