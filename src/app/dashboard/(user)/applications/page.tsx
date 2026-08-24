"use client";

import { FormEvent, useState } from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useApplications,
  useCreateApplication,
  useDeleteApplication,
  useUpdateApplication,
  type Application,
} from "@/lib/hooks/useApplications";

const STATUSES: Application["status"][] = [
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

export default function ApplicationsPage() {
  const applications = useApplications({ limit: 100 });
  const create = useCreateApplication();
  const update = useUpdateApplication();
  const remove = useDeleteApplication();
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
      toast.error(error instanceof Error ? error.message : "Could not add application");
    }
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="text-sm text-muted-foreground">
          Track every role, status and follow-up from a single backend-backed workspace.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Add an application</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company" required />
            <Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role" required />
            <Button disabled={create.isPending}><Plus className="mr-2 size-4" />Add</Button>
          </form>
        </CardContent>
      </Card>

      {applications.isLoading ? (
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
                  <p className="font-medium">{application.role}</p>
                  <p className="text-sm text-muted-foreground">{application.company}</p>
                </div>
                <Badge variant="outline">{application.status}</Badge>
                <select
                  aria-label={`Status for ${application.role}`}
                  value={application.status}
                  onChange={(event) =>
                    update.mutate({
                      id: application.id,
                      body: { status: event.target.value as Application["status"] },
                    })
                  }
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  {STATUSES.map((value) => <option key={value}>{value}</option>)}
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${application.role}`}
                  onClick={() => remove.mutate(application.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No applications yet. Add the first role above.</CardContent></Card>
      )}
    </div>
  );
}
