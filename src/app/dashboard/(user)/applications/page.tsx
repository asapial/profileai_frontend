"use client";
import Link from "next/link";
import { PageFeedback } from "@/components/dashboard/PageFeedback";

import { FormEvent, useState } from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  useApplications,
  useCreateApplication,
  useDeleteApplication,
  useUpdateApplication,
  type Application,
} from "@/lib/hooks/useApplications";

const STATUSES: Application["status"][] = [
  "SAVED",
  "PREPARING",
  "APPLIED",
  "FOLLOW_UP_DUE",
  "RECRUITER_SCREEN",
  "INTERVIEW",
  "ASSESSMENT",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

export default function ApplicationsPage() {
  const applications = useApplications({ limit: 100 });
  const create = useCreateApplication();
  const update = useUpdateApplication();
  const remove = useDeleteApplication();
  const [pendingDelete, setPendingDelete] = useState<Application | null>(null);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const add = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await create.mutateAsync({ company: company.trim(), role: role.trim() });
      setCompany("");
      setRole("");
      toast.success("Application added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add application",
      );
    }
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="text-sm text-muted-foreground">
          A place for every opportunity. Keep the role, the conversation and the
          next step together.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add an application</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={add}
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <Input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Company"
              aria-label="Company"
              required
            />
            <Input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Role"
              aria-label="Role"
              required
            />
            <Button
              disabled={create.isPending || !company.trim() || !role.trim()}
            >
              <Plus className="mr-2 size-4" />
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {applications.isError ? (
        <PageFeedback error onRetry={() => void applications.refetch()} />
      ) : applications.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading applications…</p>
      ) : applications.data?.items.length ? (
        <div className="grid gap-3">
          {applications.data.items.map((application) => (
            <Card key={application.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <span className="grid size-10 place-items-center rounded-lg bg-violet-500/10 text-violet-600">
                  <Briefcase className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/applications/${application.id}`}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {application.role}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {application.company}
                  </p>
                </div>

                <select
                  aria-label={`Status for ${application.role}`}
                  disabled={update.isPending}
                  value={application.status}
                  onChange={(event) =>
                    update.mutate(
                      {
                        id: application.id,
                        body: {
                          status: event.target.value as Application["status"],
                        },
                      },
                      {
                        onError: () =>
                          toast.error(
                            "Could not update the status. Please try again.",
                          ),
                      },
                    )
                  }
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  {STATUSES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${application.role}`}
                  onClick={() => setPendingDelete(application)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No applications yet. Add the first role above.
          </CardContent>
        </Card>
      )}
      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this application?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.role} at {pendingDelete?.company} will be removed
              from your tracker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              Keep application
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (pendingDelete)
                  remove.mutate(pendingDelete.id, {
                    onSuccess: () => {
                      setPendingDelete(null);
                      toast.success("Application removed");
                    },
                    onError: () =>
                      toast.error(
                        "Could not remove this application. Please try again.",
                      ),
                  });
              }}
            >
              {remove.isPending ? "Removing…" : "Remove application"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
