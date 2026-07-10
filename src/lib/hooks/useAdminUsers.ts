"use client";

// Admin user-directory data hook.
//
// Mirrors `useResumeList`: a single hook that fetches the directory
// page + every mutation the row actions need. Kept as one file
// because the row-action menu needs to invalidate the same query key
// (`admin-users`) regardless of which action fired.

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api";
import type { Role } from "@/types";

export type AdminUserStatus = "active" | "invited" | "suspended";

export type AdminUserListItem = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  profile: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  } | null;
  limits: {
    resumeLimit: number | null;
    apiLimit: number | null;
    overrideByAdmin: boolean;
    resetAt: string | null;
  } | null;
  _count: {
    resumes: number;
  };
};

export type AdminUserMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminUserListResponse = {
  users: AdminUserListItem[];
  meta: AdminUserMeta;
};

export type AdminUserFilters = {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role | "all";
  status?: "all" | "active" | "banned";
};

const USERS_KEY = ["admin-users"] as const;

function listKey(filters: AdminUserFilters) {
  return [...USERS_KEY, "list", filters] as const;
}

function buildQuery(filters: AdminUserFilters): string {
  const sp = new URLSearchParams();
  if (filters.page) sp.set("page", String(filters.page));
  if (filters.limit) sp.set("limit", String(filters.limit));
  if (filters.search) sp.set("search", filters.search);
  if (filters.role && filters.role !== "all") sp.set("role", filters.role);
  if (filters.status && filters.status !== "all")
    sp.set("status", filters.status);
  const qs = sp.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

export function useAdminUsers(filters: AdminUserFilters = {}) {
  return useQuery({
    queryKey: listKey(filters),
    queryFn: () => api.get<AdminUserListResponse>(buildQuery(filters)),
    placeholderData: (prev) => prev,
  });
}

export function useAdminUserDetail(id: string | null) {
  return useQuery({
    queryKey: [...USERS_KEY, "detail", id ?? ""],
    enabled: Boolean(id),
    queryFn: () => api.get<AdminUserListItem>(`/admin/users/${id}`),
  });
}

type MutationOptions<TData, TVariables> = UseMutationOptions<
  TData,
  ApiError,
  TVariables
>;

function useUserMutation<TData, TVariables>(
  mutationFn: (vars: TVariables) => Promise<TData>,
  invalidate: boolean,
  options?: MutationOptions<TData, TVariables>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    ...options,
    onSuccess: (...args) => {
      if (invalidate) qc.invalidateQueries({ queryKey: USERS_KEY });
      (options?.onSuccess as ((...a: typeof args) => void) | undefined)?.(
        ...args,
      );
    },
  });
}

export function useToggleUserStatus() {
  return useUserMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<AdminUserListItem>(`/admin/users/${id}/status`, { isActive }),
    true,
  );
}

export function useUpdateUserLimits() {
  return useUserMutation(
    ({
      id,
      resumeLimit,
      apiLimit,
    }: {
      id: string;
      resumeLimit: number;
      apiLimit: number;
    }) =>
      api.put<AdminUserListItem["limits"]>(`/admin/users/${id}/limits`, {
        resumeLimit,
        apiLimit,
      }),
    true,
  );
}

export function useChangeUserRole() {
  return useUserMutation(
    ({ id, role }: { id: string; role: Role }) =>
      api.patch<AdminUserListItem>(`/admin/users/${id}/role`, { role }),
    true,
  );
}

export function useVerifyUserEmail() {
  return useUserMutation(
    ({ id }: { id: string }) =>
      api.patch<{ id: string; emailVerified: true }>(
        `/admin/users/${id}/verify`,
        {},
      ),
    true,
  );
}

export function useForceResetUser() {
  return useUserMutation(
    ({ id }: { id: string }) =>
      api.post<{ emailSent: boolean; tempPassword?: string }>(
        `/admin/users/${id}/force-reset`,
        {},
      ),
    true,
  );
}

export function useBulkUserAction() {
  return useUserMutation(
    ({
      userIds,
      action,
    }: {
      userIds: string[];
      action: "ban" | "unban" | "verify";
    }) =>
      api.post<{ affected: number }>(`/admin/users/bulk`, {
        userIds,
        action,
      }),
    true,
  );
}

export function useDeleteUser() {
  return useUserMutation(
    ({ id }: { id: string }) =>
      api.delete<{ message: string }>(`/admin/users/${id}`),
    true,
  );
}
