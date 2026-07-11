"use client";

import Link from "next/link";
import { Loader2, Mail, MapPin, Phone, ShieldAlert, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMyProfile } from "@/lib/hooks/useMyProfile";

export function ProfileStep() {
  const { data, isLoading, isError } = useMyProfile();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your profile…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Your profile is empty
        </h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your profile. Add basic details so the AI can write
          a tailored resume.
        </p>
        <Button asChild>
          <Link href="/dashboard/profile">Complete profile</Link>
        </Button>
      </div>
    );
  }

  const fullName =
    [data.firstName, data.lastName].filter(Boolean).join(" ") ||
    "(no name yet)";

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Review imported data
        </h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ll use this to seed your resume. Edit fields inside the editor
          right after generation.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-violet-500" />
            {fullName}
          </CardTitle>
          {data.headline ? (
            <CardDescription>{data.headline}</CardDescription>
          ) : (
            <CardDescription>No headline yet — add one in your profile.</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="space-y-1.5 text-muted-foreground">
            {data.email ? (
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                {data.email}
              </li>
            ) : (
              <li className="flex items-center gap-2 text-amber-600">
                <ShieldAlert className="h-3.5 w-3.5" />
                Add an email to your profile
              </li>
            )}
            {data.phone ? (
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                {data.phone}
              </li>
            ) : null}
            {data.location ? (
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                {data.location}
              </li>
            ) : null}
          </ul>

          {data.skills && data.skills.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Skills ({data.skills.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.slice(0, 12).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950/40"
                  >
                    {s}
                  </span>
                ))}
                {data.skills.length > 12 ? (
                  <span className="text-xs text-muted-foreground">
                    +{data.skills.length - 12} more
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30">
              No skills saved yet — add them in your profile for a richer resume.
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Missing something?{" "}
        <Link href="/dashboard/profile" className="font-medium text-violet-600 hover:underline">
          Update your profile
        </Link>{" "}
        and come back.
      </p>
    </div>
  );
}
