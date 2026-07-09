"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

/* ──────────────────────────────────────────────────────────
 * Types — mirror backend CoverLetter + related job response.
 * ────────────────────────────────────────────────────────── */

export type CoverLetterStatus = "DRAFT" | "GENERATED" | "EXPORTED";

export type CoverLetterResumeRef = {
  id: string;
  title: string;
};

export type CoverLetterItem = {
  id: string;
  userId: string;
  resumeId: string;
  title: string;
  targetJobTitle: string | null;
  targetCompany: string | null;
  status: CoverLetterStatus;
  contentJson: unknown;
  contentText: string | null;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
  resume: CoverLetterResumeRef | null;
};

export type CoverLetterList = {
  items: CoverLetterItem[];
  nextCursor: string | null;
};

export type CreateCoverLetterPayload = {
  resumeId: string;
  title: string;
  targetJobTitle?: string;
  targetCompany?: string;
  contentJson?: unknown;
  contentText?: string;
};

export type UpdateCoverLetterPayload = {
  title?: string;
  targetJobTitle?: string | null;
  targetCompany?: string | null;
  status?: CoverLetterStatus;
  contentJson?: unknown;
  contentText?: string;
};

export type RegenerateCoverLetterPayload = {
  jobDescription: string;
  targetJobTitle?: string;
  targetCompany?: string;
  preservePrior?: boolean;
};

/** Shape returned by `POST /cover-letters/:id/export` — a queued ExportJob. */
export type CoverLetterExportJob = {
  id: string;
  userId: string;
  kind: "USER_DATA" | "RESUME_PDF" | "COVER_LETTER_PDF";
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  resultUrl: string | null;
  errorMsg: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

/* ──────────────────────────────────────────────────────────
 * List (cursor-paginated) — both a plain query and an infinite.
 * ────────────────────────────────────────────────────────── */

function buildListQuery(params: {
  limit?: number;
  cursor?: string | null;
  search?: string;
}): string {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.search) sp.set("search", params.search);
  const qs = sp.toString();
  return qs ? `/cover-letters?${qs}` : "/cover-letters";
}

export function useCoverLetterList(params?: {
  limit?: number;
  search?: string;
}) {
  const limit = params?.limit ?? 20;
  const search = params?.search?.trim();
  return useQuery({
    queryKey: ["cover-letters", "list", { limit, search: search ?? null }],
    queryFn: () =>
      api.get<CoverLetterList>(
        buildListQuery({ limit, search: search || undefined })
      ),
  });
}

export function useInfiniteCoverLetters(params?: {
  limit?: number;
  search?: string;
}) {
  const limit = params?.limit ?? 20;
  const search = params?.search?.trim();
  return useInfiniteQuery({
    queryKey: ["cover-letters", "infinite", { limit, search: search ?? null }],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.get<CoverLetterList>(
        buildListQuery({
          limit,
          cursor: pageParam ?? undefined,
          search: search || undefined,
        })
      ),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/* ──────────────────────────────────────────────────────────
 * Detail
 * ────────────────────────────────────────────────────────── */

export function useCoverLetter(id: string | null) {
  return useQuery({
    queryKey: ["cover-letters", "detail", id ?? ""],
    enabled: Boolean(id),
    queryFn: () => api.get<CoverLetterItem>(`/cover-letters/${id}`),
  });
}

/* ──────────────────────────────────────────────────────────
 * Mutations
 * ────────────────────────────────────────────────────────── */

export function useCreateCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCoverLetterPayload) =>
      api.post<CoverLetterItem>("/cover-letters", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cover-letters"] });
    },
  });
}

export function useUpdateCoverLetter(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCoverLetterPayload) =>
      api.put<CoverLetterItem>(`/cover-letters/${id}`, payload),
    onSuccess: (data) => {
      qc.setQueryData(["cover-letters", "detail", id], data);
      qc.invalidateQueries({ queryKey: ["cover-letters", "list"] });
    },
  });
}

export function useDeleteCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ id: string }>(`/cover-letters/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cover-letters"] });
    },
  });
}

export function useRegenerateCoverLetter(options?: {
  onSuccess?: (data: CoverLetterItem) => void;
  onError?: (err: ApiError) => void;
}) {
  const qc = useQueryClient();
  return useMutation<
    CoverLetterItem,
    ApiError,
    RegenerateCoverLetterPayload & { id: string }
  >({
    mutationFn: ({ id, ...payload }) =>
      api.post<CoverLetterItem>(`/cover-letters/${id}/regenerate`, payload),
    onSuccess: (data, vars) => {
      qc.setQueryData(["cover-letters", "detail", vars.id], data);
      qc.invalidateQueries({ queryKey: ["cover-letters", "list"] });
      options?.onSuccess?.(data);
    },
    onError: (err) => options?.onError?.(err),
  });
}

export function useExportCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<CoverLetterExportJob>(`/cover-letters/${id}/export`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["export-jobs"] });
    },
  });
}
