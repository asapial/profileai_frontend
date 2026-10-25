"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardStepper } from "@/components/resume/WizardStepper";
import { AiLoadingOverlay } from "@/components/resume/AiLoadingOverlay";
import {
  TemplateStep,
  TemplateStepSidebar,
} from "@/components/resume/wizard/TemplateStep";
import { ProfileStep } from "@/components/resume/wizard/ProfileStep";
import { JobStep } from "@/components/resume/wizard/JobStep";
import { PreviewStep } from "@/components/resume/wizard/PreviewStep";
import {
  isStepValid,
  STEPS,
  type WizardState,
  type WizardStepId,
} from "@/components/resume/wizard/WizardContext";
import {
  useGenerateResume,
  type ResumeDetail,
  type ResumeType,
} from "@/lib/hooks/useResumes";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import { useJob } from "@/lib/hooks/useJobs";

const STEP_CONTENT_IDS: Record<WizardStepId, number> = STEPS.reduce(
  (acc, s, i) => ({ ...acc, [s.id]: i }),
  {} as Record<WizardStepId, number>
);

function ToastFromError(err: { message?: string } | null | undefined): string | null {
  if (!err) return null;
  if (err.message?.includes("Resume limit")) return "Resume limit reached. Upgrade or wait for reset.";
  if (err.message?.includes("API call limit")) return "AI credit limit reached. Upgrade your plan.";
  return err.message ?? "Something went wrong.";
}

export default function CreateResumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTemplateId = searchParams.get("templateId") ?? "";
  const queryType = searchParams.get("type") === "CV" ? "CV" : "RESUME";
  const queryJobId = searchParams.get("jobId") ?? "";
  const selectedJob = useJob(queryJobId);

  const [stepIndex, setStepIndex] = useState(() =>
    queryTemplateId ? STEP_CONTENT_IDS.job : STEP_CONTENT_IDS.template
  );
  const [state, setState] = useState<WizardState>({
    jobId: queryJobId,
    templateId: queryTemplateId,
    type: queryType,
    contentDepth: queryType === "CV" ? "COMPREHENSIVE" : "STANDARD",
    title: "",
    targetJobTitle: "",
    jobDescription: "",
    profileSnapshot: null,
  });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const job = selectedJob.data;
    if (!job || state.jobId !== job.id || state.jobDescription) return;
    const update = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        title: current.title || `${job.title} — ${job.company}`.slice(0, 100),
        targetJobTitle: job.title.slice(0, 100),
        jobDescription: job.description.slice(0, 5000),
      }));
    }, 0);
    return () => window.clearTimeout(update);
  }, [selectedJob.data, state.jobDescription, state.jobId]);

  const generateMutation = useGenerateResume({
    onError: (err) => {
      const msg = ToastFromError(err);
      if (msg) toast.error(msg);
    },
  });

  const { data: dashboard } = useDashboardSummary();
  const limits = dashboard?.limits;
  const blockedByLimits = limits
    ? limits.resumeUsed >= limits.resumeLimit ||
      limits.apiUsed >= limits.apiLimit
    : false;

  const currentStep = STEPS[stepIndex];
  const validation = isStepValid(currentStep.id, state);
  const completedIds: WizardStepId[] = STEPS.slice(0, stepIndex).map(
    (s) => s.id
  );

  const setTemplateId = useCallback(
    (v: string) => setState((s) => ({ ...s, templateId: v })),
    []
  );
  const setType = useCallback(
    (v: ResumeType) => setState((s) => ({ ...s, type: v })),
    []
  );
  const setTitle = useCallback(
    (v: string) => setState((s) => ({ ...s, title: v })),
    []
  );
  const setTargetJobTitle = useCallback(
    (v: string) => setState((s) => ({ ...s, targetJobTitle: v })),
    []
  );
  const setJobDescription = useCallback(
    (v: string) => setState((s) => ({ ...s, jobDescription: v })),
    []
  );

  function goNext() {
    if (!validation.canContinue) {
      toast.error(validation.reason ?? "Complete this step to continue.");
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    // On preview step, regenerate.
    void runGenerate();
  }

  function goBack() {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function runGenerate() {
    if (blockedByLimits) {
      toast.error("You've hit a plan limit. Upgrade to keep generating.");
      return;
    }
    if (!state.templateId || !state.title.trim() || !state.targetJobTitle.trim()) {
      toast.error("Missing required fields.");
      return;
    }
    const resume = await generateMutation.mutateAsync({
      templateId: state.templateId,
      title: state.title.trim(),
      type: state.type,
      contentDepth: state.contentDepth,
      targetJobTitle: state.targetJobTitle.trim(),
      jobDescription: state.jobDescription || undefined,
    });
    toast.success("Document generated.");
    setShowPreview(true);
    // Pre-warm the dashboard editor route so the "Open in editor" click
    // feels instant. We deliberately route to the canonical dashboard
    // URL (instead of `/resume/[id]/edit`, which is a redirect hop) to
    // avoid any chance the redirect chain swallows the navigation.
    router.prefetch(`/dashboard/documents/${resume.id}/edit`);
  }

  const generatedResume: ResumeDetail | undefined = generateMutation.data;

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-4 px-3 py-4 sm:space-y-6 sm:px-5 sm:py-6 lg:px-6 lg:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Create document
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build a tailored resume or CV from your profile and target role.
          </p>
        </div>
        {showPreview && generatedResume ? (
          <Button
            variant="default"
            onClick={() => router.push(`/dashboard/documents/${generatedResume.id}/edit`)}
            className="w-full gap-2 sm:w-auto"
          >
            <ArrowRight className="h-4 w-4" />
            Continue to editor
          </Button>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-4 sm:gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <div className="rounded-2xl border border-border bg-card/80 p-2.5 backdrop-blur-xl sm:p-3">
            <WizardStepper
              steps={STEPS.map((s) => ({ ...s }))}
              currentIndex={stepIndex}
              completedIds={completedIds}
              onStepClick={(i) => {
                if (i <= stepIndex || completedIds.includes(STEPS[i].id)) {
                  setStepIndex(i);
                }
              }}
            />
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {!showPreview ? (
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              {currentStep.id === "template" && (
                <TemplateStep
                  templateId={state.templateId}
                  documentType={state.type}
                  onDocumentTypeChange={(type) => setState((current) => ({ ...current, type, templateId: "", contentDepth: type === "CV" ? "COMPREHENSIVE" : current.contentDepth === "COMPREHENSIVE" ? "STANDARD" : current.contentDepth }))}
                  onSelect={setTemplateId}
                  onAfterSelect={() => {
                    // Picking a template advances the wizard automatically,
                    // matching the user's expectation that the click itself
                    // moves them to the next step.
                    if (stepIndex < STEPS.length - 1) {
                      setStepIndex((i) => i + 1);
                    }
                  }}
                />
              )}
              {currentStep.id === "profile" && <ProfileStep />}
              {currentStep.id === "job" && (
                <JobStep
                  selectedJobId={state.jobId}
                  setSelectedJobId={(jobId) => setState((current) => ({ ...current, jobId }))}
                  title={state.title}
                  setTitle={setTitle}
                  targetJobTitle={state.targetJobTitle}
                  setTargetJobTitle={setTargetJobTitle}
                  jobDescription={state.jobDescription}
                  setJobDescription={setJobDescription}
                  contentDepth={state.contentDepth}
                  setContentDepth={(contentDepth) => setState((current) => ({ ...current, contentDepth }))}
                />
              )}
              {currentStep.id === "preview" && !generatedResume ? (
                <EmptyPreviewStep blocked={blockedByLimits} />
              ) : null}
            </div>
          ) : generatedResume ? (
            <PreviewStep
              resume={generatedResume}
              onEdit={() => router.push(`/dashboard/documents/${generatedResume.id}/edit`)}
              onRegenerate={() => {
                setShowPreview(false);
                generateMutation.reset();
                setStepIndex(STEP_CONTENT_IDS.preview);
              }}
            />
          ) : null}

          {!showPreview ? (
            <div className="sticky bottom-2 z-20 flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-background/85 p-2 shadow-xl backdrop-blur-xl sm:static sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={stepIndex === 0}
                className="min-w-0 flex-1 gap-1 sm:flex-none"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={goNext}
                disabled={!validation.canContinue || generateMutation.isPending}
                className="min-w-0 flex-1 gap-2 sm:flex-none"
              >
                {currentStep.id === "preview" && !generatedResume ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate with AI
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          ) : null}

          {!showPreview && currentStep.id === "template" ? (
            <TemplateStepSidebar templateId={state.templateId} />
          ) : null}
        </div>
      </div>

      <AiLoadingOverlay open={generateMutation.isPending} variant="generate" />
    </div>
  );
}

function EmptyPreviewStep({
  blocked,
}: {
  blocked: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,.18),transparent_46%),linear-gradient(145deg,rgba(255,255,255,.78),rgba(245,243,255,.58))] px-4 py-9 text-center shadow-[0_30px_90px_-45px_rgba(76,29,149,.5)] backdrop-blur-2xl dark:bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,.22),transparent_46%),linear-gradient(145deg,rgba(24,17,32,.8),rgba(15,10,23,.65))] sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute -left-12 bottom-0 size-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <span className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 text-white shadow-xl shadow-violet-500/25"><Sparkles className="size-7" /></span>
      <p className="relative mt-5 text-xs font-bold text-primary">Final step</p>
      <h2 className="relative mt-2 text-2xl font-semibold tracking-tight">Ready to create your document?</h2>
      <p className="relative mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        AI will structure your verified profile content for the selected role and template. You can review every field before exporting.
      </p>
      <div className="relative mx-auto mt-6 grid max-w-xl gap-2 text-left sm:grid-cols-3"><div className="rounded-xl border border-white/60 bg-white/55 p-3 backdrop-blur dark:border-white/10 dark:bg-white/5"><p className="text-xs font-semibold">Grounded content</p><p className="mt-1 text-xs text-muted-foreground">Built from your profile</p></div><div className="rounded-xl border border-white/60 bg-white/55 p-3 backdrop-blur dark:border-white/10 dark:bg-white/5"><p className="text-xs font-semibold">Selected design</p><p className="mt-1 text-xs text-muted-foreground">One consistent template</p></div><div className="rounded-xl border border-white/60 bg-white/55 p-3 backdrop-blur dark:border-white/10 dark:bg-white/5"><p className="text-xs font-semibold">Editable result</p><p className="mt-1 text-xs text-muted-foreground">Refine before export</p></div></div>
      {blocked ? (
        <p className="relative mx-auto mt-5 max-w-md rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
          Document or AI credit limit reached. Upgrade your plan to continue.
        </p>
      ) : null}
    </div>
  );
}
