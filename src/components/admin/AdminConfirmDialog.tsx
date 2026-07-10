"use client";

// Generic confirmation dialog for destructive / irreversible actions.
// Used by ban, unban, verify, force-reset, delete so each row can
// declare its own copy without duplicating dialog chrome.

import * as React from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => Promise<void> | void;
};

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  busy,
  onConfirm,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription asChild>
            <div className="text-sm">{description}</div>
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className="px-4 pb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={busy}
            onClick={async () => {
              try {
                await onConfirm();
                onOpenChange(false);
              } catch (err: unknown) {
                const msg =
                  err instanceof Error ? err.message : "Action failed.";
                toast.error(msg);
              }
            }}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
