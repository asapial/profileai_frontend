import { useState } from 'react';
import { apiClient, getErrorMessage, getErrorCode } from '@/lib/api-client';
import type { LoginResponse, RegisterResponse } from '@/types';

// ─── Register ────────────────────────────────────────

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: RegisterData): Promise<RegisterResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{ data: RegisterResponse }>('/auth/register', data);
      return res.data.data;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
}

// ─── Login ────────────────────────────────────────────

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);

  const login = async (email: string, password: string): Promise<LoginResponse | null> => {
    setLoading(true);
    setError(null);
    setErrorCode(undefined);
    try {
      const res = await apiClient.post<{ data: LoginResponse }>('/auth/login', { email, password });
      return res.data.data;
    } catch (err) {
      setError(getErrorMessage(err));
      setErrorCode(getErrorCode(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error, errorCode };
}

// ─── Verify Email ─────────────────────────────────────

export function useVerifyEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyEmail = async (email: string, otp: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/verify-email', { email, otp });
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { verifyEmail, loading, error };
}

// ─── Two Factor ───────────────────────────────────────

export function useTwoFactor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyTwoFactor = async (email: string, otp: string): Promise<LoginResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{ data: LoginResponse }>('/auth/2fa/verify', { email, otp });
      return res.data.data;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { verifyTwoFactor, loading, error };
}

// ─── Forgot Password ──────────────────────────────────

export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forgotPassword = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { forgotPassword, loading, error };
}

// ─── Reset Password ───────────────────────────────────

export function useResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetPassword = async (
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/reset-password', { email, otp, newPassword, confirmPassword });
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { resetPassword, loading, error };
}

// ─── Logout ───────────────────────────────────────────

export function useLogout() {
  const [loading, setLoading] = useState(false);

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setLoading(false);
      window.location.href = '/login';
    }
  };

  return { logout, loading };
}

// ─── Resend OTP ───────────────────────────────────────

export function useResendOtp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resendOtp = async (
    email: string,
    type: 'EMAIL_VERIFY' | 'FORGET_PASSWORD' | 'TWO_FACTOR'
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/otp/resend', { email, type });
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { resendOtp, loading, error };
}

// ─── 2FA Management ───────────────────────────────────

export function use2FAManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enable2FA = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/2fa/enable');
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirm2FA = async (otp: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/2fa/confirm', { otp });
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async (otp: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/2fa/disable', { otp });
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { enable2FA, confirm2FA, disable2FA, loading, error };
}
