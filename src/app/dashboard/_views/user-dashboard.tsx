// User dashboard home — the default landing for any authenticated USER
// role at `/dashboard`.
//
// Composition per U-P1:
//   1. Greeting header (user's first name + time-of-day copy)
//   2. Quick-action tiles (Create Resume, Analyze JD, Track Application)
//      with limit-aware disabled states and tooltips
//   3. Profile completion + Plan usage widgets side-by-side
//   4. Recent resumes + Recent applications + Notification preview
//
// Each widget renders its own loading/empty/error state so a single slow
// query never blocks the rest of the page.

import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { QuickActionTiles } from "@/components/dashboard/QuickActionTiles";
import { LimitUsageWidget } from "@/components/dashboard/LimitUsageWidget";
import { ProfileCompletionCard } from "@/components/dashboard/ProfileCompletionCard";
import { RecentApplicationsList } from "@/components/dashboard/RecentApplicationsList";
import { RecentResumesList } from "@/components/dashboard/RecentResumesList";
import { NotificationsPreview } from "@/components/dashboard/NotificationsPreview";

export function UserDashboardView() {
  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 md:space-y-8 md:py-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <GreetingHeader />
      </header>

      <section aria-label="Quick actions">
        <QuickActionTiles />
      </section>

      <section className="grid gap-4 md:grid-cols-2 md:gap-6">
        <ProfileCompletionCard />
        <LimitUsageWidget />
      </section>

      <section className="grid gap-4 md:grid-cols-2 md:gap-6">
        <RecentResumesList />
        <RecentApplicationsList />
      </section>

      <section className="grid gap-4 md:grid-cols-2 md:gap-6">
        <NotificationsPreview />
      </section>
    </div>
  );
}