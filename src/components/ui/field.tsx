import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string }>(
  function Field({ label, hint, error, id: suppliedId, className, ...props }, ref) {
    const generatedId = useId();
    const id = suppliedId ?? generatedId;
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    return (
      <label htmlFor={id} className="grid gap-1.5 text-sm font-medium">
        <span>{label}</span>
        <input
          {...props}
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          className={cn("min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60", className)}
        />
        {hint ? <span id={hintId} className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
        {error ? <span id={errorId} className="text-xs font-normal text-destructive">{error}</span> : null}
      </label>
    );
  },
);
