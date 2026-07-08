"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { password: string; confirmation: string }) =>
      api.post<{ ok: true }>("/user/delete-account", body),
    onSuccess: () => {
      qc.clear();
    },
  });
}
