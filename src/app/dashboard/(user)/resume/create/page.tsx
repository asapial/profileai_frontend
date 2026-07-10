"use client";

import { useCallback, useState } from "react";
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
import { TypeStep } from "@/components/resume/wizard/TypeStep";
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

  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<WizardState>({
    templateId: queryTemplateId,
    type: queryType,
    title: "",
    targetJobTitle: "",
    jobDescription: "",
    profileSnapshot: null,
  });
  const [showPreview, setShowPreview] = useState(false);

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
      targetJobTitle: state.targetJobTitle.trim(),
      jobDescription: state.jobDescription || undefined,
    });
    toast.success("Resume generated.");
    setShowPreview(true);
    router.prefetch(`/resume/${resume.id}/edit`);
  }

  const generatedResume: ResumeDetail | undefined = generateMutation.data;

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Create resume
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell the AI what role this resume should win.
          </p>
        </div>
        {showPreview && generatedResume ? (
          <Button
            variant="default"
            onClick={() => router.push(`/resume/${generatedResume.id}/edit`)}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Continue to editor
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-3">
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
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              {currentStep.id === "template" && (
                <TemplateStep
                  templateId={state.templateId}
                  onSelect={setTemplateId}
                />
              )}
              {currentStep.id === "type" && (
                <TypeStep type={state.type} onChange={setType} />
              )}
              {currentStep.id === "profile" && <ProfileStep />}
              {currentStep.id === "job" && (
                <JobStep
                  title={state.title}
                  setTitle={setTitle}
                  type={state.type}
                  setType={setType}
                  targetJobTitle={state.targetJobTitle}
                  setTargetJobTitle={setTargetJobTitle}
                  jobDescription={state.jobDescription}
                  setJobDescription={setJobDescription}
                />
              )}
              {currentStep.id === "preview" && !generatedResume ? (
                <EmptyPreviewStep onGenerate={runGenerate} blocked={blockedByLimits} />
              ) : null}
            </div>
          ) : generatedResume ? (
            <PreviewStep
              resume={generatedResume}
              onEdit={() => router.push(`/resume/${generatedResume.id}/edit`)}
              onRegenerate={() => {
                setShowPreview(false);
                generateMutation.reset();
                setStepIndex(STEP_CONTENT_IDS.preview);
              }}
            />
          ) : null}

          {!showPreview ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={goBack}
                disabled={stepIndex === 0}
                className="gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={goNext}
                disabled={!validation.canContinue || generateMutation.isPending}
                className="gap-2"
              >
                {currentStep.id === "job" || (currentStep.id === "preview" && !generatedResume) ? (
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
  onGenerate,
  blocked,
}: {
  onGenerate: () => void | Promise<void>;
  blocked: boolean;
}) {
  return (
    <div className="space-y-4 text-center sm:py-8">
      <Sparkles className="mx-auto h-8 w-8 text-violet-500" />
      <h2 className="text-lg font-semibold">Ready to generate?</h2>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">
        We&apos;ll send your inputs to the AI and build a structured resume. You
        can edit every field afterward.
      </p>
      <Button
        onClick={onGenerate}
        disabled={blocked}
        className="mx-auto gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {blocked ? "Limit reached" : "Generate with AI"}
      </Button>
      {blocked ? (
        <p className="text-xs text-rose-600">
          Resume or AI credit limit reached. Upgrade your plan to continue.
        </p>
      ) : null}
    </div>
  );
}
