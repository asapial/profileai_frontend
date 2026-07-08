"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Variant = "primary" | "secondary" | "ghost";

type CtaButtonProps = {
  href: string;
  label: string;
  variant?: Variant;
  eventName?: string;
  trailingArrow?: boolean;
  className?: string;
};

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    "bg-foreground text-background shadow-lg shadow-violet-500/20 hover:opacity-90",
  secondary:
    "border border-border bg-background text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
};

export function CtaButton({
  href,
  label,
  variant = "primary",
  eventName,
  trailingArrow = true,
  className,
}: CtaButtonProps) {
  const [busy, setBusy] = useState(false);

  return (
    <Link
      href={href}
      onClick={() => {
        if (eventName) track({ name: eventName, properties: { href } });
        setBusy(true);
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      <span>{label}</span>
      {trailingArrow && !busy && <ArrowRight className="h-4 w-4" />}
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
    </Link>
  );
}
