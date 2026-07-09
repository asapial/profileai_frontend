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
  createdAt: string;
  updatedAt: string;
  _count: { resumes: number };
};

export type TemplateSort =
  | "featured"
  | "newest"
  | "name-asc"
  | "most-used";

export const TEMPLATE_SORTS: { value: TemplateSort; label: string }[] = [
  { value: "featured", label: "Featured first" },
  { value: "newest", label: "Newest" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "most-used", label: "Most used" },
];

export function sortTemplates(
  items: Template[],
  sort: TemplateSort
): Template[] {
  const copy = [...items];
  switch (sort) {
    case "newest":
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "name-asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "most-used":
      return copy.sort(
        (a, b) =>
          b._count.resumes - a._count.resumes ||
          a.name.localeCompare(b.name)
      );
    case "featured":
    default:
      return copy.sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return a.displayOrder - b.displayOrder;
      });
  }
}

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