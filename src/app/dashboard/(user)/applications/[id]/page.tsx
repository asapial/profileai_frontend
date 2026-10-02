"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, ExternalLink } from "lucide-react";

import { useApplication, useUpdateApplication, type Application } from "@/lib/hooks/useApplications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApplicationDetailPage() {
  const id = String(useParams<{ id: string }>().id);
  const query = useApplication(id);

  if (query.isLoading) {
    return <Skeleton className="m-6 h-72" />;
  }
  if (!query.data) {
    return <Card className="m-6 p-8">Application not found.</Card>;
  }
  const application = query.data;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard/jobs">
          <ArrowLeft className="mr-2 size-4" />
          Job workspace
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BriefcaseBusiness className="size-5" />
                {application.role}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {application.company}
                {application.location ? ` · ${application.location}` : ""}
              </p>
            </div>
            <Badge>{application.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Applied {new Date(application.appliedAt).toLocaleDateString()}
          </p>
          {application.resume ? (
            <p className="text-sm text-muted-foreground">
              Resume: {application.resume.title}
            </p>
          ) : null}
          {application.notes ? (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
              {application.notes}
            </div>
          ) : null}
          {application.jobUrl ? (
            <Button asChild variant="outline">
              <a href={application.jobUrl} target="_blank" rel="noreferrer">
                Job posting <ExternalLink className="ml-2 size-4" />
              </a>
            </Button>
          ) : null}
          <Button asChild>
            <Link href={`/dashboard/career?tab=Interview&application=${application.id}`}>
              Prepare interview in Career Studio
            </Link>
          </Button>
        </CardContent>
      </Card>
      <ApplicationActions key={application.id} application={application} />
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {application.events?.length ? (
            <ol className="space-y-3">
              {application.events.map((event) => (
                <li key={event.id} className="border-l-2 pl-4 text-sm">
                  <p className="font-medium">{event.type.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApplicationActions({ application }: { application: Application }) {
  const update = useUpdateApplication();
  const localTime = (value?: string | null) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
  const cls = "mt-2 block w-full rounded-lg border bg-background p-3 text-sm";
  return <Card><CardHeader><CardTitle>Your next action</CardTitle></CardHeader><CardContent>
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget); try { await update.mutateAsync({ id: application.id, body: { status: String(f.get("status")) as Application["status"], nextAction: String(f.get("nextAction")) || null, contactName: String(f.get("contactName")) || null, contactEmail: String(f.get("contactEmail")) || null, reminderAt: f.get("reminderAt") ? new Date(String(f.get("reminderAt"))).toISOString() : null, deadlineAt: f.get("deadlineAt") ? new Date(String(f.get("deadlineAt"))).toISOString() : null, notes: String(f.get("notes")) } }); toast.success("Application updated"); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save"); } }}>
      <label>Status<select name="status" defaultValue={application.status} className={cls}>{["SAVED", "PREPARING", "APPLIED", "FOLLOW_UP_DUE", "RECRUITER_SCREEN", "INTERVIEW", "ASSESSMENT", "OFFER", "REJECTED", "WITHDRAWN"].map(s => <option key={s} value={s}>{s.toLowerCase().replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase())}</option>)}</select></label>
      <label>Next action<input name="nextAction" maxLength={500} defaultValue={application.nextAction ?? ""} className={cls}/></label>
      <label>Contact name<input name="contactName" defaultValue={application.contactName ?? ""} className={cls}/></label><label>Contact email<input type="email" name="contactEmail" defaultValue={application.contactEmail ?? ""} className={cls}/></label>
      <label>Follow-up reminder (local time)<input type="datetime-local" name="reminderAt" defaultValue={localTime(application.reminderAt)} className={cls}/></label><label>Deadline (local time)<input type="datetime-local" name="deadlineAt" defaultValue={localTime(application.deadlineAt)} className={cls}/></label>
      <label className="sm:col-span-2">Notes and interview rounds<textarea name="notes" maxLength={2000} defaultValue={application.notes ?? ""} rows={4} className={cls}/></label><Button type="submit" disabled={update.isPending}>Save next action</Button>{application.jobId && <Button asChild variant="outline"><Link href={`/dashboard/jobs/${application.jobId}`}>Linked Job Workspace</Link></Button>}
    </form></CardContent></Card>;
}
