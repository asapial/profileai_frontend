"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { HomepageConfig, HomepageEditor } from "@/lib/homepage";

const KEY = ["admin-homepage"] as const;

export function useAdminHomepage() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<HomepageEditor>("/admin/homepage"),
  });
}

export function useSaveHomepage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: HomepageConfig) =>
      api.put<HomepageEditor>("/admin/homepage", { draft }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function usePublishHomepage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<HomepageEditor>("/admin/homepage/publish", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
