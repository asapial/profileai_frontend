"use client";

// Limits editor — opens from a row action.
//
// Why a drawer: the directory is data-dense and row actions shouldn't
// steal screen space. The drawer pins to the right and lets an admin
// confirm changes without leaving the table.

import { useState } from "react";
import { toast } from "react-hot-toast";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateUserLimits } from "@/lib/hooks/useAdminUsers";

type AdminUserLimits = {
  resumeLimit: number | null;
  apiLimit: number | null;
  overrideByAdmin: boolean;
};

type Props = {
  userId: string | null;
  userEmail: string | null;
  initial: AdminUserLimits | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminEditLimitsDrawer({
  userId,
  userEmail,
  initial,
  open,
  onOpenChange,
}: Props) {
  const update = useUpdateUserLimits();
  const [resumeLimit, setResumeLimit] = useState(() =>
    initial?.resumeLimit != null ? String(initial.resumeLimit) : "",
  );
  const [apiLimit, setApiLimit] = useState(() =>
    initial?.apiLimit != null ? String(initial.apiLimit) : "",
  );
  const [errors, setErrors] = useState<{
    resumeLimit?: string;
    apiLimit?: string;
  }>({});

  // Re-sync local inputs whenever the target row changes (or the drawer
  // re-opens with new initial values). Keying the form on the userId +
  // open state is enough — the user can't edit while closed.
  if (open && resumeLimit === "" && apiLimit === "" && initial) {
    setResumeLimit(initial.resumeLimit != null ? String(initial.resumeLimit) : "");
    setApiLimit(initial.apiLimit != null ? String(initial.apiLimit) : "");
  }

  const validate = () => {
    const next: typeof errors = {};
    const resume = Number(resumeLimit);
    if (!Number.isFinite(resume) || resume < 0) {
      next.resumeLimit = "Must be a non-negative number.";
    }
    const apiVal = Number(apiLimit);
    if (!Number.isFinite(apiVal) || apiVal < 0) {
      next.apiLimit = "Must be a non-negative number.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    if (!validate()) return;
    try {
      await update.mutateAsync({
        id: userId,
        resumeLimit: Number(resumeLimit),
        apiLimit: Number(apiLimit),
      });
      toast.success("Limits updated.");
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not update limits.";
      toast.error(msg);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit limits</SheetTitle>
          <SheetDescription>
            Override per-user plan limits for {userEmail ?? "this user"}.
            Leave a field blank to inherit the plan default.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="resumeLimit">Resume limit</Label>
            <Input
              id="resumeLimit"
              type="number"
              min={0}
              inputMode="numeric"
              value={resumeLimit}
              onChange={(e) => setResumeLimit(e.target.value)}
              aria-invalid={Boolean(errors.resumeLimit)}
              placeholder="e.g. 25"
            />
            {errors.resumeLimit ? (
              <p className="text-destructive text-xs">{errors.resumeLimit}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="apiLimit">API limit / day</Label>
            <Input
              id="apiLimit"
              type="number"
              min={0}
              inputMode="numeric"
              value={apiLimit}
              onChange={(e) => setApiLimit(e.target.value)}
              aria-invalid={Boolean(errors.apiLimit)}
              placeholder="e.g. 200"
            />
            {errors.apiLimit ? (
              <p className="text-destructive text-xs">{errors.apiLimit}</p>
            ) : null}
          </div>

          <SheetFooter className="px-0 pb-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={update.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save limits"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
