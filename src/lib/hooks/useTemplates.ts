"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type TemplateCategory = "MODERN" | "CLASSIC" | "CREATIVE" | "ATS";

export type Template = {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: TemplateCategory;
  isDefault: boolean;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  _count: { resumes: number };
};

export function useTemplates(params: {
  category?: TemplateCategory | "ALL";
  featured?: boolean;
} = {}) {
  const search = new URLSearchParams();
  if (params.category && params.category !== "ALL")
    search.set("category", params.category);
  if (params.featured) search.set("featured", "true");
  const qs = search.toString();
  const path = qs ? `/templates?${qs}` : "/templates";

  return useQuery({
    queryKey: ["templates", params.category ?? "ALL", params.featured ?? false],
    queryFn: () => api.get<Template[]>(path),
  });
}

export function useTemplate(id: string | null) {
  return useQuery({
    queryKey: ["template", id],
    enabled: Boolean(id),
    queryFn: () => api.get<{ template: Template; sampleData: unknown }>(`/templates/${id}`),
  });
}