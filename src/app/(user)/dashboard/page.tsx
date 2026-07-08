"use client";

import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  FileText,
  LayoutGrid,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileCompletionCard } from "@/components/dashboard/ProfileCompletionCard";
import { LimitUsageWidget } from "@/components/dashboard/LimitUsageWidget";
import { RecentResumesList } from "@/components/dashboard/RecentResumesList";
import { RecentApplicationsList } from "@/components/dashboard/RecentApplicationsList";
import { NotificationsPreview } from "@/components/dashboard/NotificationsPreview";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = data?.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your job search today.
          </p>
        </div>
        <Button asChild size="sm" className="gap-2 self-start sm:self-auto">
          <Link href="/resumes/new">
            <Plus className="h-4 w-4" />
            Create resume
          </Link>
        </Button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <QuickAction
          href="/resumes/new"
          icon={<FileText className="h-4 w-4" />}
          label="New resume"
        />
        <QuickAction
          href="/templates"
          icon={<LayoutGrid className="h-4 w-4" />}
          label="Browse templates"
        />
        <QuickAction
          href="/applications/new"
          icon={<Briefcase className="h-4 w-4" />}
          label="Add application"
        />
        <QuickAction
          href="/profile"
          icon={<Sparkles className="h-4 w-4" />}
          label="Enhance profile"
        />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Resumes created"
          value={isLoading ? "—" : (data?.stats.resumesCreated ?? 0)}
        />
        <StatTile
          label="Active applications"
          value={isLoading ? "—" : (data?.stats.activeApplications ?? 0)}
        />
        <StatTile
          label="Avg ATS score"
          value={
            isLoading
              ? "—"
              : data?.stats.averageAtsScore != null
                ? `${Math.round(data.stats.averageAtsScore)}`
                : "—"
          }
          hint={
            data?.stats.averageAtsScore != null
              ? "Across your resumes"
              : undefined
          }
        />
        <StatTile
          label="Unread"
          value={isLoading ? "—" : (data?.stats.unreadNotifications ?? 0)}
          hint="Notifications"
        />
      </div>

      {/* Two-column widget grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileCompletionCard />
        <LimitUsageWidget />
        <RecentResumesList />
        <RecentApplicationsList />
        <div className="lg:col-span-2">
          <NotificationsPreview />
        </div>
      </div>

      {/* Footer card */}
      <Card className="overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/20 dark:via-background dark:to-fuchsia-950/20">
        <CardHeader>
          <CardTitle>Need inspiration?</CardTitle>
          <CardDescription>
            Pick a fresh template and rebuild your resume in minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/templates">
              Explore templates
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/20"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/10 to-fuchsia-500/10 text-violet-600 group-hover:from-violet-600 group-hover:to-fuchsia-500 group-hover:text-white">
        {icon}
      </span>
      <span>{label}</span>
      <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
    </Link>
  );
}