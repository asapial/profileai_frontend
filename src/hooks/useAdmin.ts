import { useState, useEffect } from 'react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import type { DashboardStats, UserWithProfile, UserLimit, PlatformConfig } from '@/types';

export function useAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<{ data: DashboardStats }>('/admin/dashboard')
      .then((res) => setStats(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}

export function useAdminUsers(page = 1, limit = 20, search?: string, statusFilter?: string) {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page, limit, total: 0, totalPages: 1 });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const res = await apiClient.get<{ data: UserWithProfile[]; meta: typeof meta }>(
        `/admin/users?${params}`
      );
      setUsers(res.data.data);
      if (res.data.meta) setMeta(res.data.meta);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page, limit, search, statusFilter]);

  const updateLimits = async (userId: string, resumeLimit: number, apiLimit: number) => {
    await apiClient.put(`/admin/users/${userId}/limits`, { resumeLimit, apiLimit });
    fetchUsers();
  };

  const toggleStatus = async (userId: string, isActive: boolean) => {
    await apiClient.patch(`/admin/users/${userId}/status`, { isActive });
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    await apiClient.delete(`/admin/users/${userId}`);
    fetchUsers();
  };

  return { users, loading, meta, updateLimits, toggleStatus, deleteUser, refetch: fetchUsers };
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<{ data: PlatformConfig[] }>('/admin/settings')
      .then((res) => setSettings(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async (updates: Array<{ key: string; value: string }>) => {
    setSaving(true);
    setError(null);
    try {
      await apiClient.put('/admin/settings', { settings: updates });
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { settings, loading, saving, error, saveSettings };
}

export function useAdminAnalytics(from?: Date, to?: Date) {
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (from) params.set('from', from.toISOString());
    if (to) params.set('to', to.toISOString());
    apiClient.get<{ data: Record<string, unknown> }>(`/admin/analytics?${params}`)
      .then((res) => setAnalytics(res.data.data))
      .finally(() => setLoading(false));
  }, [from?.toISOString(), to?.toISOString()]);

  return { analytics, loading };
}
