import type {
  ResumeContentData,
  ResumeEducation,
  ResumeExperience,
} from "@/lib/hooks/useResumes";

/**
 * Resume storage uses `from`/`to` dates (the AI prompt and the Prisma seed
 * use them), but the in-app editor uses `startDate`/`endDate` for clarity.
 * These helpers keep both fields populated so:
 *   - the AI prompt and any future consumer reading `from`/`to` still works
 *   - the editor UI doesn't need to know about the storage shape
 *   - the preview pane (which reads `from`/`to`) renders correctly
 */

export function normalizeExperience(exp: ResumeExperience): ResumeExperience {
  const from = exp.from ?? exp.startDate ?? "";
  const to = exp.to ?? exp.endDate ?? "";
  return {
    ...exp,
    from,
    to,
    startDate: exp.startDate ?? exp.from ?? "",
    endDate: exp.endDate ?? exp.to ?? "",
  };
}

export function normalizeEducation(ed: ResumeEducation): ResumeEducation {
  const from = ed.from ?? ed.startDate ?? "";
  const to = ed.to ?? ed.endDate ?? "";
  return {
    ...ed,
    from,
    to,
    startDate: ed.startDate ?? ed.from ?? "",
    endDate: ed.endDate ?? ed.to ?? "",
  };
}

export function normalizeContentData(
  data: ResumeContentData | null | undefined
): ResumeContentData {
  if (!data) return {};
  return {
    ...data,
    experience: (data.experience ?? []).map(normalizeExperience),
    education: (data.education ?? []).map(normalizeEducation),
  };
}

/**
 * Strip the client-only `id` field from experience/education before sending
 * to the API. Backend stores `contentData` as JSON and doesn't expect this
 * synthetic React key. We still keep it in local state for stable lists.
 */
export function sanitizeForApi(
  data: ResumeContentData | null | undefined
): ResumeContentData {
  if (!data) return {};
  return {
    ...data,
    experience: (data.experience ?? []).map(
      ({ id: _id, ...rest }) => rest
    ) as ResumeExperience[],
    education: (data.education ?? []).map(
      ({ id: _id, ...rest }) => rest
    ) as ResumeEducation[],
  };
}
