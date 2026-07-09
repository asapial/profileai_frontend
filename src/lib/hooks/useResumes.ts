"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

/* ──────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────── */

export type ResumeStatus = "DRAFT" | "GENERATED" | "EXPORTED";
export type ResumeType = "RESUME" | "CV";

export type ResumeListItem = {
  id: string;
  title: string;
  type: ResumeType;
  status: ResumeStatus;
  targetJobTitle: string | null;
  atsScore: number | null;
  isPublic: boolean;
  slug: string | null;
  updatedAt: string;
  template?: {
    name: string;
    category: string;
  } | null;
};

export type ResumeTemplateRef = {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string | null;
  htmlLayout: string;
  cssStyles: string;
};

export type ResumeDetail = {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  type: ResumeType;
  status: ResumeStatus;
  targetJobTitle: string | null;
  jobDescription: string | null;
  atsScore: number | null;
  contentData: ResumeContentData;
  aiSuggestions: AtsResult | null;
  pdfUrl: string | null;
  version: number;
  isPublic: boolean;
  slug: string | null;
  createdAt: string;
  updatedAt: string;
  template: ResumeTemplateRef | null;
};

export type ResumeExperience = {
  id?: string;
  title?: string;
  role?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  from?: string;
  to?: string;
  current?: boolean;
  bullets?: string[];
};

export type ResumeEducation = {
  id?: string;
  institution?: string;
  school?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  from?: string;
  to?: string;
  gpa?: string;
  description?: string;
};

export type ResumeCertification = {
  name?: string;
  issuer?: string;
  year?: string;
};

export type ResumePersonalInfo = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  website?: string;
  linkedIn?: string;
  github?: string;
};

export type ResumeContentData = {
  summary?: string;
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  skills?: string[];
  languages?: string[];
  certifications?: ResumeCertification[];
  personalInfo?: ResumePersonalInfo;
  [key: string]: unknown;
};

export type AtsResult = {
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: Array<{ section: string; issue: string; suggestion: string }>;
};

export type ResumeHistoryEntry = {
  id: string;
  version: number;
  snapshot: ResumeContentData;
  changedBy: string;
  createdAt: string;
  label?: string | null;
  summary?: string | null;
};

export type ResumeMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type GenerateResumePayload = {
  templateId: string;
  title: string;
  type: ResumeType;
  targetJobTitle: string;
  jobDescription?: string;
};

export type UpdateResumePayload = {
  title?: string;
  contentData?: ResumeContentData;
  targetJobTitle?: string;
  jobDescription?: string;
};

export type AtsCheckPayload = { jobDescription: string };
export type AiModifyPayload = { section: string; instruction: string };

/* ──────────────────────────────────────────────────────────
 * Query helpers
 * ────────────────────────────────────────────────────────── */

const listKey = (params: ResumeListParams) => ["resumes", "list", params] as const;
const detailKey = (id: string) => ["resumes", "detail", id] as const;
const historyKey = (id: string) => ["resumes", "history", id] as const;

export type ResumeListParams = {
  page?: number;
  limit?: number;
  type?: ResumeType;
  status?: ResumeStatus;
  folderId?: string;
  search?: string;
};

export type ResumeListResponse = {
  resumes: ResumeListItem[];
  meta: ResumeMeta;
};

function buildQuery(params: ResumeListParams): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.type) sp.set("type", params.type);
  if (params.status) sp.set("status", params.status);
  if (params.folderId) sp.set("folderId", params.folderId);
  if (params.search) sp.set("search", params.search);
  const qs = sp.toString();
  return qs ? `/resumes?${qs}` : "/resumes";
}

/* ──────────────────────────────────────────────────────────
 * Hooks
 * ────────────────────────────────────────────────────────── */

export function useResumeList(params: ResumeListParams = {}) {
  return useQuery({
    queryKey: listKey(params),
    queryFn: () => api.get<ResumeListResponse>(buildQuery(params)),
  });
}

export function useResume(id: string | null) {
  return useQuery({
    queryKey: detailKey(id ?? ""),
    enabled: Boolean(id),
    queryFn: () => api.get<ResumeDetail>(`/resumes/${id}`),
  });
}

export function useResumeHistory(id: string | null) {
  return useQuery({
    queryKey: historyKey(id ?? ""),
    enabled: Boolean(id),
    queryFn: () => api.get<ResumeHistoryEntry[]>(`/resumes/${id}/history`),
  });
}

export function useGenerateResume(
  options?: UseMutationOptions<ResumeDetail, ApiError, GenerateResumePayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post<ResumeDetail>("/resumes/generate", payload),
    ...options,
    onSuccess: (...args) => {
      const [data] = args as unknown as [ResumeDetail, GenerateResumePayload];
      qc.invalidateQueries({ queryKey: ["resumes", "list"] });
      qc.setQueryData(detailKey(data.id), data);
      // Forward to any caller-provided onSuccess.
      (options?.onSuccess as ((...a: typeof args) => void) | undefined)?.(
        ...args
      );
    },
  });
}

export function useUpdateResume(
  id: string,
  options?: UseMutationOptions<
    ResumeDetail,
    ApiError,
    UpdateResumePayload
  >
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put<ResumeDetail>(`/resumes/${id}`, payload),
    ...options,
    onSuccess: (...args) => {
      const [data] = args as unknown as [ResumeDetail, UpdateResumePayload];
      qc.setQueryData(detailKey(id), data);
      qc.invalidateQueries({ queryKey: historyKey(id) });
      (options?.onSuccess as ((...a: typeof args) => void) | undefined)?.(
        ...args
      );
    },
  });
}

export function useDeleteResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<null>(`/resumes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resumes", "list"] });
    },
  });
}

export function useDuplicateResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<ResumeDetail>(`/resumes/${id}/duplicate`, {}),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["resumes", "list"] });
      qc.setQueryData(detailKey(data.id), data);
    },
  });
}

export function useAtsCheck(
  id: string,
  options?: UseMutationOptions<{ resume: ResumeDetail; atsData: AtsResult }, ApiError, AtsCheckPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post<{ resume: ResumeDetail; atsData: AtsResult }>(
        `/resumes/${id}/ats-check`,
        payload
      ),
    ...options,
    onSuccess: (...args) => {
      const [data] = args as unknown as [
        { resume: ResumeDetail; atsData: AtsResult },
        AtsCheckPayload
      ];
      qc.setQueryData(detailKey(id), data.resume);
      (options?.onSuccess as ((...a: typeof args) => void) | undefined)?.(
        ...args
      );
    },
  });
}

export function useAiModify(
  id: string,
  options?: UseMutationOptions<ResumeDetail, ApiError, AiModifyPayload>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.put<ResumeDetail>(`/resumes/${id}/ai-modify`, payload),
    ...options,
    onSuccess: (...args) => {
      const [data] = args as unknown as [ResumeDetail, AiModifyPayload];
      qc.setQueryData(detailKey(id), data);
      (options?.onSuccess as ((...a: typeof args) => void) | undefined)?.(
        ...args
      );
    },
  });
}

export function useRestoreVersion(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (version: number) =>
      api.post<ResumeDetail>(`/resumes/${id}/restore/${version}`, {}),
    onSuccess: (data) => {
      qc.setQueryData(detailKey(id), data);
      qc.invalidateQueries({ queryKey: historyKey(id) });
    },
  });
}

export function useExportResume(
  options?: UseMutationOptions<{ presignedUrl?: string; jobId?: string }, ApiError, { id: string; format?: "A4" | "Letter" }>
) {
  return useMutation({
    mutationFn: ({ id, format }) =>
      api.post<{ presignedUrl?: string; jobId?: string }>(`/resumes/${id}/export`, {
        format: format ?? "A4",
      }),
    ...options,
  });
}
