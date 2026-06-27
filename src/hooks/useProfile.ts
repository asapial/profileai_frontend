import { useState, useEffect, useCallback } from 'react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import type { UserWithProfile, LoginDevice, UserLimit, UserProfile } from '@/types';

// ─── Get Profile ─────────────────────────────────────

export function useProfile() {
  const [profile, setProfile] = useState<UserWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: UserWithProfile }>('/user/profile');
      setProfile(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

// ─── Update Profile ───────────────────────────────────

export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.put<{ data: UserProfile }>('/user/profile', data);
      return res.data.data;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateProfile, loading, error };
}

// ─── Upload Avatar ────────────────────────────────────

export function useUploadAvatar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = async (file: File): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await apiClient.post<{ data: { avatarUrl: string } }>('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data.avatarUrl;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadAvatar, loading, error };
}

// ─── Change Password ──────────────────────────────────

export function useChangePassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.put('/user/change-password', { currentPassword, newPassword, confirmPassword });
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { changePassword, loading, error };
}

// ─── Devices ──────────────────────────────────────────

export function useDevices() {
  const [devices, setDevices] = useState<LoginDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: LoginDevice[] }>('/user/devices');
      setDevices(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const revokeDevice = async (deviceId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/user/devices/${deviceId}`);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  return { devices, loading, error, revokeDevice, refetch: fetchDevices };
}

// ─── Limits ───────────────────────────────────────────

export function useUserLimits() {
  const [limits, setLimits] = useState<UserLimit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<{ data: UserLimit }>('/user/limits')
      .then((res) => setLimits(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return { limits, loading };
}
