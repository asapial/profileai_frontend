// Temporary stub: the original resume edit page contained unresolved
// git merge markers that broke compilation of the entire app. The
// full editor (U-P5) will be re-implemented as part of that page's
// dedicated pass; for now we hand the user back to the resumes list
// so the rest of the app loads cleanly.

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResumeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  void params;
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
        <FileText className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Resume editor is being rebuilt</h1>
        <p className="text-sm text-muted-foreground">
          The inline editor is temporarily unavailable. You can still view and
          manage your resumes from the list below.
        </p>
      </div>
      <Button asChild variant="outline" className="gap-1">
        <Link href="/dashboard/resumes">
          <ArrowLeft className="h-4 w-4" />
          Back to resumes
        </Link>
      </Button>
    </div>
  );
}
