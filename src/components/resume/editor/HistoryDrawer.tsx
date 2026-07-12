"use client";

import { useState } from "react";
import { History, Loader2, RotateCcw, X } from "lucide-react";
import toast from "react-hot-toast";
import type { ResumeHistoryEntry } from "@/lib/hooks/useResumes";
import { useRestoreVersion } from "@/lib/hooks/useResumes";

type Props = {
  resumeId: string;
  open: boolean;
  onClose: () => void;
  entries: ResumeHistoryEntry[];
  isLoading: boolean;
};

export function HistoryDrawer({ resumeId, open, onClose, entries, isLoading }: Props) {
  const restore = useRestoreVersion(resumeId);
  const [pendingVersion, setPendingVersion] = useState<number | null>(null);

  if (!open) return null;

  function commitRestore(version: number) {
    if (!window.confirm(`Restore version ${version}? Your current draft will be saved in version history first.`)) {
      return;
    }
    setPendingVersion(version);
    restore.mutate(version, {
      onSuccess: () => {
        toast.success(`Restored v${version}.`);
        onClose();
      },
      onError: (err) => {
        toast.error(err.message ?? "Failed to restore version.");
      },
      onSettled: () => setPendingVersion(null),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside className="flex h-full w-full max-w-md flex-col bg-card shadow-xl">
        <header className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-violet-500" />
            <h2 className="text-base font-semibold">Version history</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading history…
            </div>
          ) : entries.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No saved versions yet.
            </p>
          ) : (
            <ol className="space-y-3">
              {entries.map((e) => (
                <li
                  key={e.version}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">
                        v{e.version}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          · {e.label ?? "auto-save"}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString()}
                      </p>
                      {e.summary ? (
                        <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                          {e.summary}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => commitRestore(e.version)}
                      disabled={restore.isPending}
                      className="flex shrink-0 items-center gap-1 rounded-md border border-violet-300 px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                    >
                      {pendingVersion === e.version && restore.isPending ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Restoring…
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-3 w-3" /> Restore
                        </>
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}
