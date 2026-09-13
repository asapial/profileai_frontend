"use client";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
export function PageFeedback({
  loading,
  error,
  onRetry,
}: {
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-xl border bg-card p-8"
      role={error ? "alert" : "status"}
      aria-live="polite"
    >
      <p className="font-medium">
        {error
          ? "This page couldn’t load its data."
          : "Getting your workspace ready…"}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {error
          ? "Your work is still saved. Try loading it again."
          : "Your latest information will appear here shortly."}
      </p>
      {loading && (
        <div className="mt-6 grid gap-3" aria-hidden>
          <div className="h-3 w-2/3 animate-shimmer rounded" />
          <div className="h-3 w-1/2 animate-shimmer rounded" />
        </div>
      )}
      {error && onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RefreshCw size={14} />
          Try again
        </Button>
      )}
    </div>
  );
}
