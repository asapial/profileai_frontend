import { Briefcase, CheckCircle2, Clock, XCircle } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

const ROWS = [
  {
    role: "Senior Engineer",
    company: "Acme Corp",
    status: "Interview",
    appliedAt: "Jul 02",
    tone: "good" as const,
    icon: CheckCircle2,
  },
  {
    role: "Full-Stack Developer",
    company: "Northwind",
    status: "Applied",
    appliedAt: "Jul 04",
    tone: "info" as const,
    icon: Clock,
  },
  {
    role: "Tech Lead",
    company: "Globex",
    status: "Rejected",
    appliedAt: "Jun 28",
    tone: "bad" as const,
    icon: XCircle,
  },
  {
    role: "Software Engineer",
    company: "Initech",
    status: "Phone Screen",
    appliedAt: "Jul 05",
    tone: "good" as const,
    icon: CheckCircle2,
  },
] as const;

const TONE_STYLES: Record<(typeof ROWS)[number]["tone"], string> = {
  good: "bg-emerald-50 text-emerald-700",
  info: "bg-sky-50 text-sky-700",
  bad: "bg-rose-50 text-rose-700",
};

export function ApplicationTrackerSection() {
  return (
    <section className="bg-muted/30 py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <SectionHeader
            align="left"
            eyebrow="Application tracker"
            title={<>Stop losing track of where you applied</>}
            description="Log every application in one place. See what's working, what isn't, and never forget a follow-up again."
          />
          <ul className="mt-8 space-y-2.5 text-sm text-muted-foreground">
            {[
              "Status, contact, and follow-up dates at a glance",
              "Notes per application to remember the details",
              "Charts showing your interview conversion rate",
              "Reminders so you never miss a recruiter email",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-sky-500/10 to-violet-500/10 blur-2xl" />
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Briefcase className="h-4 w-4 text-violet-600" />
                Applications
              </div>
              <span className="text-xs text-muted-foreground">12 active</span>
            </div>
            <ul className="divide-y divide-border">
              {ROWS.map((row) => {
                const Icon = row.icon;
                return (
                  <li
                    key={`${row.role}-${row.company}`}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {row.role}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.company} · applied {row.appliedAt}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONE_STYLES[row.tone]}`}
                    >
                      <Icon className="h-3 w-3" />
                      {row.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
