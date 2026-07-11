"use client";

// Small shell used by every dashboard widget. Renders the same Card
// chrome plus loading (skeleton), empty (onboarding), and inline error
// (retry) states so the page spec is honored per widget rather than
// blocking the whole grid.

import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RotateCw } from "lucide-react";

export function WidgetCard({
  title,
  description,
  icon,
  action,
  skeletonRows = 3,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  skeletonRows?: number;
  children: ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function WidgetSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-2/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

export function WidgetError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50/60 p-3 text-sm text-rose-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">We couldn&apos;t load this widget.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2 gap-1"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    </div>
  );
}

export function WidgetEmpty({
  title,
  description,
  cta,
}: {
  title: string;
  description?: string;
  cta?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
      ) : null}
      {cta}
    </div>
  );
}
