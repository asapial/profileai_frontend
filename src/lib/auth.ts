// Authentication client helpers. The backend stores access/refresh tokens as
// httpOnly cookies, so the browser receives and sends them automatically on
// subsequent requests — we never read them from JS. The server returns the
// accessToken in the JSON body purely as a convenience so server-rendered
// contexts (tests, future SSR) can stash it elsewhere.

import { api, ApiError } from "./api";
import { env } from "./env";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  TwoFactorVerifyRequest,
  User,
} from "@/types";

export type LoginResult =
  | { kind: "ok"; user: User; accessToken: string }
  | { kind: "2fa"; email: string }
  | { kind: "device-limit"; recoveryToken: string }
  | { kind: "error"; message: string; code?: string };

/**
 * Establish the same-origin session marker used by the dashboard proxy.
 * The normal path remains the server-validated Next route. During local
 * development, backend and frontend share the `localhost` cookie jar; if a
 * stale dev server has not discovered the new route yet, verify the freshly
 * issued JWT against `/auth/me` before creating only the non-sensitive role
 * marker. The httpOnly access token still comes from the backend response.
 */
export async function syncFrontendSession(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/post-login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    if (response.ok) return true;
    if (response.status !== 404 || typeof window === "undefined") return false;

    const apiUrl = new URL(env.apiBaseUrl, window.location.origin);
    if (apiUrl.hostname !== window.location.hostname) return false;

    const parts = accessToken.split(".");
    if (parts.length !== 3) return false;
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    const claims = JSON.parse(atob(padded)) as { userId?: unknown; role?: unknown; exp?: unknown };
    if ((claims.role !== "USER" && claims.role !== "ADMIN") || typeof claims.userId !== "string" || typeof claims.exp !== "number" || claims.exp <= Date.now() / 1000) return false;

    const current = await api.get<{ user: { id: string; role: "USER" | "ADMIN" } }>("/auth/me", { cache: "no-store" });
    if (current.user.id !== claims.userId || current.user.role !== claims.role) return false;

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `userRole=${claims.role}; Path=/; Max-Age=43200; SameSite=Lax${secure}`;
    return true;
  } catch {
    return false;
  }
}

export const login = async (
  payload: LoginRequest
): Promise<LoginResult> => {
  try {
    const data = await api.post<LoginResponse>("/auth/login", payload);
    if ("deviceLimitReached" in data) {
      return { kind: "device-limit", recoveryToken: data.recoveryToken };
    }
    if (data.twoFactorRequired) {
      return { kind: "2fa", email: data.email };
    }
    return { kind: "ok", user: data.user, accessToken: data.accessToken };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Login failed. Please try again.";
    return {
      kind: "error",
      message,
      ...(err instanceof ApiError && err.code ? { code: err.code } : {}),
    };
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
  | { kind: "device-limit"; recoveryToken: string }
  | { kind: "error"; message: string };

export const verifyTwoFactor = async (
  payload: TwoFactorVerifyRequest
): Promise<Verify2FAResult> => {
  try {
    const data = await api.post<LoginResponse>(
      "/auth/2fa/verify",
      payload
    );
    if ("deviceLimitReached" in data) {
      return { kind: "device-limit", recoveryToken: data.recoveryToken };
    }
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

export type CompleteDeviceRecoveryResult =
  | {
      kind: "ok";
      user: User;
      accessToken: string;
      revoked: { sessions: number; devices: number };
    }
  | { kind: "error"; message: string };

export const completeDeviceRecovery = async (
  recoveryToken: string
): Promise<CompleteDeviceRecoveryResult> => {
  try {
    const data = await api.post<{
      user: User;
      accessToken: string;
      revoked: { sessions: number; devices: number };
    }>("/auth/device-recovery/complete", { recoveryToken });
    return { kind: "ok", ...data };
  } catch (err) {
    return {
      kind: "error",
      message:
        err instanceof Error
          ? err.message
          : "Could not replace existing devices. Please log in again.",
    };
  }
};

export const logout = async (): Promise<{ ok: boolean }> => {
  try {
    await api.post<null>("/auth/logout", {});
  } catch {
    // Even if the backend call fails, still try to clear local state
    // so the user isn't stuck behind a stale cookie.
  }
  // Clear the frontend-issued role cookie that the edge middleware reads.
  // We deliberately don't throw if this fails — the next navigation will
  // still re-evaluate against the (now-cleared) accessToken cookie.
  try {
    await fetch("/api/auth/post-logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    /* non-fatal */
  }
  return { ok: true };
};

export type CurrentUser = User & {
  image?: string | null;
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
    const data = await api.get<{ user: CurrentUser }>("/auth/me", {
      signal: AbortSignal.timeout(4_000),
    });
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

/**
 * Result shape for password-recovery helpers.
 *
 * The `forgot-password` endpoint always returns the same generic message
 * regardless of whether the email exists, so we collapse success and
 * "unknown email" into a single OK branch on the client.
 */
export type PasswordRecoveryResult = {
  ok: boolean;
  /** Human-readable message — server response on success, error on failure. */
  message: string;
};

/**
 * Request a password-reset OTP. Always returns `ok: true` from the user's
 * perspective — the backend intentionally hides whether the email exists.
 */
export const requestPasswordReset = async (
  payload: ForgotPasswordRequest
): Promise<PasswordRecoveryResult> => {
  try {
    const data = await api.post<{ message: string }>(
      "/auth/forgot-password",
      payload
    );
    return { ok: true, message: data.message };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Could not request a password reset. Please try again.",
    };
  }
};

/**
 * Reset a password using an OTP sent to the user's email.
 *
 * On success the backend invalidates all sessions for the account, so the
 * caller should immediately route the user back to `/login` (e.g. with
 * `?reset=1` to surface a success banner).
 */
export const resetPassword = async (
  payload: ResetPasswordRequest
): Promise<PasswordRecoveryResult> => {
  try {
    const data = await api.post<{ message: string }>(
      "/auth/reset-password",
      payload
    );
    return { ok: true, message: data.message };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Password reset failed. Please try again.",
    };
  }
};
