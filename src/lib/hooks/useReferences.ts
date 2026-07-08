"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Reference = {
  id: string;
  name: string;
  relationship: string;
  company: string | null;
  email: string | null;
  phone: string | null;
};

export function useReferences() {
  return useQuery({
    queryKey: ["references"],
    queryFn: () => api.get<Reference[]>("/user/references"),
  });
}

export function useCreateReference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Reference>) =>
      api.post<Reference>("/user/references", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["references"] }),
  });
}

export function useUpdateReference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Reference> }) =>
      api.put<Reference>(`/user/references/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["references"] }),
  });
}

export function useDeleteReference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ id: string }>(`/user/references/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["references"] }),
  });
}
