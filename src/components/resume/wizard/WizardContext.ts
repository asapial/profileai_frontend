"use client";

import type { ResumeType } from "@/lib/hooks/useResumes";

/**
 * Shared wizard state. Lives in the parent /resume/create page, with each step
 * receiving `state` + setters as props so steps stay presentational and
 * controlled. Held in React state (page-local) so it survives rerenders.
 * The spec mentions Zustand — for an isolated wizard lifetime ~ < 5 min we
 * keep it in React state to avoid pulling another dependency.
 */
export type WizardState = {
  templateId: string;
  type: ResumeType;
  title: string;
  targetJobTitle: string;
  jobDescription: string;
  /** Snapshot of imported profile data for review step (read-only display). */
  profileSnapshot: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    headline?: string | null;
    skills?: string[];
  } | null;
};

export type WizardSetters = {
  setTemplateId: (v: string) => void;
  setType: (v: ResumeType) => void;
  setTitle: (v: string) => void;
  setTargetJobTitle: (v: string) => void;
  setJobDescription: (v: string) => void;
};

export type WizardStepValidation = {
  canContinue: boolean;
  reason?: string;
};

export const STEPS = [
  { id: "template", label: "Template", description: "Pick a layout" },
  { id: "type", label: "Document type", description: "Resume or CV" },
  { id: "profile", label: "Your data", description: "Review profile" },
  { id: "job", label: "Job details", description: "Role & JD" },
  { id: "preview", label: "Preview & export", description: "ATS & PDF" },
] as const;

export type WizardStepId = (typeof STEPS)[number]["id"];

export function isStepValid(
  stepId: WizardStepId,
  state: WizardState
): WizardStepValidation {
  switch (stepId) {
    case "template":
      return state.templateId
        ? { canContinue: true }
        : { canContinue: false, reason: "Pick a template to continue." };
    case "type":
      return state.type
        ? { canContinue: true }
        : { canContinue: false, reason: "Choose a document type." };
    case "profile":
      // Profile data is derived server-side; always valid once it loads.
      return { canContinue: true };
    case "job":
      if (!state.title.trim()) return { canContinue: false, reason: "Add a resume title." };
      if (!state.targetJobTitle.trim())
        return { canContinue: false, reason: "Add a target job title." };
      return { canContinue: true };
    case "preview":
      return { canContinue: true };
  }
}