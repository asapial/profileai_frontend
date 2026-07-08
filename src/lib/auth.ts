// Authentication client helpers. The backend stores access/refresh tokens as
// httpOnly cookies, so the browser receives and sends them automatically on
// subsequent requests — we never read them from JS. The server returns the
// accessToken in the JSON body purely as a convenience so server-rendered
// contexts (tests, future SSR) can stash it elsewhere.

import { api } from "./api";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  TwoFactorVerifyRequest,
  User,
} from "@/types";

export type LoginResult =
  | { kind: "ok"; user: User; accessToken: string }
  | { kind: "2fa"; email: string }
  | { kind: "error"; message: string; code?: string };

export const login = async (
  payload: LoginRequest
): Promise<LoginResult> => {
  try {
    const data = await api.post<LoginResponse>("/auth/login", payload);
    if (data.twoFactorRequired) {
      return { kind: "2fa", email: data.email };
    }
    return { kind: "ok", user: data.user, accessToken: data.accessToken };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Login failed. Please try again.";
    return { kind: "error", message };
  }
};

export type RegisterResult =
  | { kind: "ok"; userId: string; email: string }
  | { kind: "error"; message: string; code?: string };

export const register = async (
  payload: RegisterRequest
): Promise<RegisterResult> => {
  try {
    const data = await api.post<RegisterResponse>("/auth/register", payload);
    return { kind: "ok", userId: data.userId, email: data.email };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Registration failed. Please try again.";
    return { kind: "error", message };
  }
};

export type VerifyEmailResult =
  | { kind: "ok"; email: string }
  | { kind: "error"; message: string; code?: string };

export const verifyEmail = async (
  payload: { email: string; otp: string }
): Promise<VerifyEmailResult> => {
  try {
    const data = await api.post<{ email: string }>(
      "/auth/verify-email",
      payload
    );
    return { kind: "ok", email: data.email };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Verification failed. Please try again.";
    return { kind: "error", message };
  }
};

export const resendVerificationOtp = async (
  payload: { email: string }
): Promise<{ ok: boolean; message: string }> => {
  try {
    await api.post<{ message: string }>("/auth/otp/resend", {
      email: payload.email,
      type: "EMAIL_VERIFY",
    });
    return {
      ok: true,
      message: "A new code has been sent to your email.",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to resend code.";
    return { ok: false, message };
  }
};

export type Verify2FAResult =
  | { kind: "ok"; user: User; accessToken: string }
  | { kind: "error"; message: string };

export const verifyTwoFactor = async (
  payload: TwoFactorVerifyRequest
): Promise<Verify2FAResult> => {
  try {
    const data = await api.post<LoginResponse>(
      "/auth/2fa/verify",
      payload
    );
    if (data.twoFactorRequired) {
      // Should never happen on the verify endpoint; treat defensively.
      return { kind: "error", message: "Unexpected response from server." };
    }
    return { kind: "ok", user: data.user, accessToken: data.accessToken };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Verification failed. Please try again.";
    return { kind: "error", message };
  }
};

export const logout = async (): Promise<{ ok: boolean }> => {
  try {
    await api.post<null>("/auth/logout", {});
    return { ok: true };
  } catch {
    return { ok: false };
  }
};

export type CurrentUser = User & {
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  profile?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    headline: string | null;
  } | null;
  limits?: {
    resumeLimit: number;
    apiLimit: number;
    resumeUsed: number;
    apiUsed: number;
    resetAt: string;
  } | null;
  completionPercentage?: number;
};

/**
 * Fetches the currently authenticated user. Returns null if the request
 * fails (e.g. unauthenticated) so callers can render "logged out" UI.
 */
export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  try {
    const data = await api.get<{ user: CurrentUser }>("/auth/me");
    return data.user;
  } catch {
    return null;
  }
};

/**
 * Computes the destination route after a successful login based on the
 * user's role. Admins land in `/admin`, regular users in `/dashboard`.
 */
export const postLoginRoute = (user: Pick<User, "role">): string =>
  user.role === "ADMIN" ? "/admin" : "/dashboard";
