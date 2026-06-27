import * as React from "react";
import { cn } from "@/lib/utils";

export const Badge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[--color-badge-bg] px-3 py-1 text-xs font-medium text-[--color-badge-text]",
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";
