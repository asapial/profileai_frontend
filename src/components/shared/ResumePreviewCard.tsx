import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AtsScoreBar } from "@/components/shared/AtsScoreBar";

export function ResumePreviewCard() {
  return (
    <Card className="relative mx-auto max-w-md overflow-hidden border-white/15 bg-white/95 p-5 text-slate-950 shadow-2xl dark:bg-[--color-bg-card] dark:text-[--color-text-primary]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">Jordan Miller</p>
          <p className="text-sm text-slate-500 dark:text-[--color-text-body]">Product Engineer</p>
        </div>
        <Badge>AI Draft</Badge>
      </div>
      <div className="space-y-3">
        <div className="h-3 w-3/4 rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-3 w-5/6 rounded-full bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="my-5 rounded-lg border border-slate-200 p-4 dark:border-[--color-border]">
        <p className="mb-2 text-sm font-medium">Experience rewrite</p>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-[--color-text-body]">
          Increased onboarding completion by 31% by redesigning account setup flows and shipping
          data-informed experiments.
        </p>
      </div>
      <AtsScoreBar score={92} />
    </Card>
  );
}
