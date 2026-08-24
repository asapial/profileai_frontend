"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type TemplateCategory = "MODERN" | "CLASSIC" | "CREATIVE" | "ATS";
export type TemplateDocumentType = "RESUME" | "CV";
export type TemplateReviewStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
export type TemplateCustomization = {
  accentColor?: string;
  fontFamily?: "Inter" | "Source Sans 3" | "IBM Plex Sans" | "Georgia" | "Arial" | "Merriweather";
  spacing?: "compact" | "comfortable" | "airy";
  headingStyle?: "uppercase" | "title" | "minimal";
};

export type Template = {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  htmlLayout: string;
  cssStyles: string;
  category: TemplateCategory;
  documentType: TemplateDocumentType;
  reviewStatus: TemplateReviewStatus;
  customization: TemplateCustomization | null;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  isCommunity: boolean;
  owner?: { id?: string; name: string; email?: string } | null;
  sourceTemplateId?: string | null;
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
  documentType?: TemplateDocumentType | "ALL";
  featured?: boolean;
} = {}) {
  const search = new URLSearchParams();
  if (params.category && params.category !== "ALL")
    search.set("category", params.category);
  if (params.featured) search.set("featured", "true");
  if (params.documentType && params.documentType !== "ALL")
    search.set("documentType", params.documentType);
  const qs = search.toString();
  const path = qs ? `/templates?${qs}` : "/templates";

  return useQuery({
    queryKey: ["templates", params.category ?? "ALL", params.documentType ?? "ALL", params.featured ?? false],
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

const MY_TEMPLATES_KEY = ["my-templates"] as const;

export function useMyTemplates(enabled = true) {
  return useQuery({
    queryKey: MY_TEMPLATES_KEY,
    enabled,
    queryFn: () => api.get<Template[]>("/templates/mine"),
  });
}

export function useForkTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { sourceTemplateId: string; name?: string }) =>
      api.post<Template>("/templates/mine", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_TEMPLATES_KEY }),
  });
}

export function useUpdateMyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: {
      id: string;
      name?: string;
      description?: string;
      category?: TemplateCategory;
      documentType?: TemplateDocumentType;
      customization?: TemplateCustomization;
    }) => api.put<Template>(`/templates/mine/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_TEMPLATES_KEY }),
  });
}

export function useSubmitMyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Template>(`/templates/mine/${id}/submit`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_TEMPLATES_KEY }),
  });
}

export function useDeleteMyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ status: "deleted" | "archived" }>(`/templates/mine/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_TEMPLATES_KEY }),
  });
}
