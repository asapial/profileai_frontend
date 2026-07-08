"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Session = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceLabel: string | null;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
};

export type LoginDevice = {
  id: string;
  ipAddress: string | null;
  deviceLabel: string | null;
  location: string | null;
  lastLoginAt: string;
  isTrusted: boolean;
};

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.get<Session[]>("/user/sessions"),
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: true }>(`/user/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useRevokeAllSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.delete<{ ok: true }>("/user/sessions", { all: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useLoginDevices() {
  return useQuery({
    queryKey: ["login-devices"],
    queryFn: () => api.get<LoginDevice[]>("/user/login-devices"),
  });
}

export function useTrustDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<LoginDevice>(`/user/login-devices/${id}/trust`, { trusted: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["login-devices"] }),
  });
}

export function useRevokeDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ ok: true }>(`/user/login-devices/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["login-devices"] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api.post<{ ok: true }>("/user/change-password", body),
  });
}

export function useToggleTwoFactor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      api.post<{ ok: true; enabled: boolean }>("/user/2fa/toggle", { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
