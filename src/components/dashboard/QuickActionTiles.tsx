"use client";

// Quick-action tiles shown at the top of `/dashboard`.
//
// Three primary actions per the U-P1 spec:
//   - Create Resume  → /resume/create
//   - Analyze JD     → /tools/jd-analyzer
//   - Track Application → /applications
//
// Limits are surfaced as a disabled state with a tooltip rather than a
// silent failure: the spec explicitly says "exactly at limit" tiles
// should not be clickable. The "Analyze JD" tile shares the AI usage
// counter; the other two are freeform and only block when the resume
// limit is full.

import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import {
  Briefcase,
  FileText,
  ScanSearch,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import { track } from "@/lib/analytics";

type Tile = {
  id: "create" | "analyze" | "track";
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent: string;
};

const TILES: Tile[] = [
  {
    id: "create",
    label: "Create resume",
    description: "Start a tailored resume with AI.",
    href: "/resume/create",
    icon: FileText,
    accent: "from-violet-500/15 to-fuchsia-500/10 text-violet-700",
  },
  {
    id: "analyze",
    label: "Analyze JD",
    description: "Break down a job description.",
    href: "/tools/jd-analyzer",
    icon: ScanSearch,
    accent: "from-fuchsia-500/15 to-rose-500/10 text-fuchsia-700",
  },
  {
    id: "track",
    label: "Track application",
    description: "Add to your job pipeline.",
    href: "/applications",
    icon: Briefcase,
    accent: "from-amber-500/15 to-orange-500/10 text-amber-700",
  },
];

function limitReason(
  limits:
    | {
        resumeUsed: number;
        resumeLimit: number;
        apiUsed: number;
        apiLimit: number;
      }
    | undefined,
  tileId: Tile["id"]
): string | null {
  if (!limits) return null;
  const resumeFull = limits.resumeLimit !== -1 && limits.resumeUsed >= limits.resumeLimit;
  const apiFull = limits.apiLimit !== -1 && limits.apiUsed >= limits.apiLimit;

  // Resume creation consumes both a resume slot and an AI credit.
  if (tileId === "create" && (resumeFull || apiFull)) {
    if (resumeFull && apiFull) {
      return "Resume and AI limits reached. Upgrade to keep generating.";
    }
    return resumeFull
      ? "Resume limit reached. Upgrade to add more."
      : "AI credit limit reached. Upgrade to keep generating.";
  }
  // JD analyzer only consumes AI credits.
  if (tileId === "analyze" && apiFull) {
    return "AI credit limit reached. Upgrade to keep generating.";
  }
  return null;
}

export function QuickActionTiles() {
  const { data } = useDashboardSummary();
  const limits = data?.limits;
  const trackedRef = useRef(false);

  // Fire `dashboard_view` once per mount. Doing this in an effect rather
  // than during render avoids the lint "refs during render" rule and
  // also keeps React strict-mode double-invokes from double-counting.
  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    track({
      name: "dashboard_view",
      properties: {
        profileCompleteness: data?.profile?.completionPercentage ?? 0,
        usagePercent: limits?.apiPercent ?? 0,
      },
    });
  }, [data?.profile?.completionPercentage, limits?.apiPercent]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TILES.map((tile) => {
          const reason = limitReason(limits, tile.id);
          const disabled = reason !== null;
          const Icon = tile.icon;
          const body = (
            <Link
              href={tile.href}
              aria-disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              onClick={(e) => {
                if (disabled) {
                  e.preventDefault();
                  return;
                }
                track({
                  name: "dashboard_quick_action_click",
                  properties: { action: tile.id },
                });
              }}
              className={
                "group relative flex h-full items-start gap-3 rounded-2xl border border-border bg-card p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 " +
                (disabled
                  ? "cursor-not-allowed opacity-60"
                  : "hover:border-violet-300 hover:shadow-sm")
              }
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${tile.accent}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {tile.label}
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-violet-400 opacity-0 transition group-hover:opacity-100" />
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {tile.description}
                </span>
              </span>
            </Link>
          );

          if (!disabled) return <Fragment key={tile.id}>{body}</Fragment>;
          return (
            <Tooltip key={tile.id}>
              <TooltipTrigger asChild>{body}</TooltipTrigger>
              <TooltipContent side="bottom">{reason}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}