import { AlertCircle, CheckCircle2, Gauge } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

export function AtsScoreSection() {
  return (
    <section className="bg-muted/30 py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <AtsMockup />

        <div>
          <SectionHeader
            align="left"
            eyebrow="ATS scoring"
            title={<>What is an ATS score, in plain English</>}
            description={
              <>
                Most companies use an Applicant Tracking System (ATS) to filter
                resumes before a human ever sees them. ProFile AI scores your
                resume the way an ATS would, then tells you exactly what to
                fix — no jargon, no guessing.
              </>
            }
          />

          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  Match the keywords the job wants
                </p>
                <p className="text-muted-foreground">
                  We compare your resume to the job description and highlight
                  missing skills and phrases.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-600">
                <AlertCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  Fix formatting before it filters you out
                </p>
                <p className="text-muted-foreground">
                  Tables, columns, headers and images can confuse older ATS
                  parsers. We flag them for you.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet-50 text-violet-600">
                <Gauge className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold text-foreground">
                  Watch your score climb as you edit
                </p>
                <p className="text-muted-foreground">
                  Real-time scoring means you know exactly when your resume is
                  ready to send.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function AtsMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/10 to-sky-500/10 blur-2xl" />
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">ATS Score</p>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
            Strong
          </span>
        </div>

        <div className="mt-4 flex items-end gap-2">
          <p className="text-5xl font-bold tracking-tight text-foreground">92</p>
          <p className="pb-2 text-sm text-muted-foreground">/ 100</p>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-violet-500"
            style={{ width: "92%" }}
          />
        </div>

        <div className="mt-6 space-y-2.5 text-xs">
          <Row label="Keyword match" value={96} tone="good" />
          <Row label="Section completeness" value={100} tone="good" />
          <Row label="Readability" value={88} tone="good" />
          <Row label="Formatting" value={74} tone="warn" />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "warn";
}) {
  const bar = tone === "good" ? "bg-emerald-500" : "bg-amber-500";
  return (
    <div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>{label}</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
