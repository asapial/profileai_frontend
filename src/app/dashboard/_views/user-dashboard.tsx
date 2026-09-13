import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { QuickActionTiles } from "@/components/dashboard/QuickActionTiles";
import { LimitUsageWidget } from "@/components/dashboard/LimitUsageWidget";
import { ProfileCompletionCard } from "@/components/dashboard/ProfileCompletionCard";
import { RecentApplicationsList } from "@/components/dashboard/RecentApplicationsList";
import { RecentResumesList } from "@/components/dashboard/RecentResumesList";
export function UserDashboardView() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-7 px-4 py-3 sm:px-6 lg:px-8">
      <header className="studio-dashboard-intro">
        <p className="studio-eyebrow mb-4 text-primary">
          YOUR WORK, IN PROGRESS
        </p>
        <GreetingHeader />
      </header>
      <section aria-label="Start your next task">
        <QuickActionTiles />
      </section>
      <div className="studio-dashboard-grid">
        <div className="studio-dashboard-main">
          <RecentResumesList />
          <RecentApplicationsList />
        </div>
        <aside className="studio-dashboard-aside" aria-label="Profile and plan">
          <ProfileCompletionCard />
          <LimitUsageWidget />
        </aside>
      </div>
    </div>
  );
}
