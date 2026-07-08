"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeleteAccount } from "@/lib/hooks/useAccount";

export function DangerTab() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const mut = useDeleteAccount();

  const submit = () => {
    if (confirm !== "DELETE") {
      toast.error('Type DELETE to confirm');
      return;
    }
    mut.mutate(
      { password, confirmation: confirm },
      {
        onSuccess: () => {
          toast.success("Account deleted");
          router.push("/");
        },
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Failed"),
      }
    );
  };

  return (
    <Card className="border-rose-500/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-rose-600">
          <AlertTriangle className="h-4 w-4" />
          Delete account
        </CardTitle>
        <CardDescription>
          This permanently deletes your profile, resumes, applications, projects
          and references. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 0 ? (
          <Button variant="destructive" onClick={() => setStep(1)}>
            I want to delete my account
          </Button>
        ) : (
          <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
            <p className="text-sm font-medium">Are you absolutely sure?</p>
            <p className="text-xs text-muted-foreground">
              We&apos;ll ask for your password, then a final confirmation.
            </p>
            {step === 1 ? (
              <>
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => setStep(2)}
                    disabled={!password}
                  >
                    Continue
                  </Button>
                  <Button variant="outline" onClick={() => setStep(0)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder='Type DELETE to confirm'
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={submit}
                    disabled={mut.isPending || confirm !== "DELETE"}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {mut.isPending ? "Deleting…" : "Delete forever"}
                  </Button>
                  <Button variant="outline" onClick={() => setStep(0)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}