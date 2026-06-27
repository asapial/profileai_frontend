import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
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
Input.displayName = "Input";
