"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { track, type AnalyticsEventName } from "@/lib/analytics";

type Variant = "primary" | "secondary" | "ghost";

type CtaButtonProps = {
  href: string;
  label: string;
  variant?: Variant;
  eventName?: AnalyticsEventName;
  trailingArrow?: boolean;
  className?: string;
};

const VARIANT_STYLES: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
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
  return (
    <Link
      href={href}
      onClick={() => {
        if (eventName) track({ name: eventName, properties: { href } });
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      <span>{label}</span>
      {trailingArrow && <ArrowRight className="h-4 w-4" />}
    </Link>
  );
}
