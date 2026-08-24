"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, ExternalLink } from "lucide-react";

import { useApplication } from "@/lib/hooks/useApplications";
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
        <Link href="/dashboard/applications">
          <ArrowLeft className="mr-2 size-4" />
          Applications
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
        </CardContent>
      </Card>
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
