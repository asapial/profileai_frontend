"use client";

// Help article management hooks (A-P12).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type HelpArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  status: ArticleStatus;
  authorName: string;
  updatedAt: string;
  views: number;
};

export type HelpCategory = {
  id: string;
  name: string;
  slug: string;
  articleCount: number;
};

export type HelpArticleDetail = HelpArticle & {
  body: string;
};

export const ADMIN_HELP_QUERY_KEY = ["admin-help-articles"] as const;

export function useAdminHelpArticles(filters: {
  status?: ArticleStatus | "ALL";
  category?: string;
  q?: string;
} = {}) {
  return useQuery({
    queryKey: [...ADMIN_HELP_QUERY_KEY, filters],
    queryFn: async () => {
      try {
        const qs = new URLSearchParams();
        if (filters.status && filters.status !== "ALL")
          qs.set("status", filters.status);
        if (filters.category) qs.set("category", filters.category);
        if (filters.q) qs.set("q", filters.q);
        const path =
          qs.toString().length > 0
            ? `/admin/help-articles?${qs.toString()}`
            : "/admin/help-articles";
        const r = await api.get<HelpArticle[]>(path);
        return r.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404)
          return [] as HelpArticle[];
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminHelpCategories() {
  return useQuery({
    queryKey: ["admin-help-categories"],
    queryFn: async () => {
      try {
        const r = await api.get<HelpCategory[]>("/admin/help-categories");
        return r.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404)
          return [] as HelpCategory[];
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminHelpArticle(id: string | null) {
  return useQuery({
    queryKey: ["admin-help-article", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const r = await api.get<HelpArticleDetail>(`/admin/help-articles/${id}`);
        return r.data;
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: Boolean(id),
  });
}

export function useCreateHelpArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      slug: string;
      excerpt: string;
      body: string;
      category: string;
    }) => api.post<HelpArticle>("/admin/help-articles", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_HELP_QUERY_KEY }),
  });
}

export function useUpdateHelpArticle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<HelpArticleDetail>) =>
      api.put<HelpArticleDetail>(`/admin/help-articles/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-help-article", id] });
      qc.invalidateQueries({ queryKey: ADMIN_HELP_QUERY_KEY });
    },
  });
}

export function useTransitionHelpArticle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (next: ArticleStatus) =>
      api.patch<HelpArticle>(`/admin/help-articles/${id}`, { status: next }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_HELP_QUERY_KEY }),
  });
}
