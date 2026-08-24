"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";

import {
  useCoverLetter,
  useUpdateCoverLetter,
} from "@/lib/hooks/useCoverLetters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoverLetterDetailPage() {
  const id = String(useParams<{ id: string }>().id);
  const query = useCoverLetter(id);

  if (query.isLoading) return <Skeleton className="m-6 h-96" />;
  if (!query.data) {
    return <Card className="m-6 p-8">Cover letter not found.</Card>;
  }
  return (
    <CoverLetterEditor
      key={query.data.updatedAt}
      id={id}
      initial={query.data}
    />
  );
}

function CoverLetterEditor({
  id,
  initial,
}: {
  id: string;
  initial: NonNullable<ReturnType<typeof useCoverLetter>["data"]>;
}) {
  const update = useUpdateCoverLetter(id);
  const [content, setContent] = useState(initial.contentText ?? "");

  const save = async () => {
    try {
      await update.mutateAsync({ contentText: content });
      toast.success("Cover letter saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed.");
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard/cover-letters">
          <ArrowLeft className="mr-2 size-4" />
          Cover letters
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{initial.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {[initial.targetJobTitle, initial.targetCompany]
                  .filter(Boolean)
                  .join(" · ") || "General cover letter"}
              </p>
            </div>
            <Badge>{initial.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={20}
            aria-label="Cover letter content"
            className="w-full rounded-lg border bg-background p-4 text-sm leading-7 outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={save} disabled={update.isPending}>
            <Save className="mr-2 size-4" />
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
