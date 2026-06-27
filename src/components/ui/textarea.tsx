import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-[--color-border] bg-[--color-bg-surface] px-4 py-2.5 text-sm text-[--color-text-primary]",
        "placeholder:text-[--color-text-muted] focus:border-[--color-accent] focus:outline-none focus:ring-2 focus:ring-[--color-accent]/25",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
