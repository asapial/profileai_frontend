// Shared application types. Kept intentionally narrow — these describe the
// wire shape that the frontend cares about, not the full Prisma schema.

export type Role = "USER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

// ─── Auth ────────────────────────────────────────────

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: true;
  /** Optional referral code, validated server-side when present. */
  referredByCode?: string;
};

/** Payload returned from `POST /auth/register`. */
export type RegisterResponse = {
  userId: string;
  email: string;
};

export type TwoFactorVerifyRequest = {
  email: string;
  otp: string;
};

/** Payload sent to `POST /auth/forgot-password`. */
export type ForgotPasswordRequest = {
  email: string;
};

/** Payload sent to `POST /auth/reset-password`. */
export type ResetPasswordRequest = {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
};

/**
 * `data` payload shape from `POST /auth/login` and `POST /auth/2fa/verify`.
 * The login endpoint may return `{ twoFactorRequired: true, email }` and skip
 * the user / token fields; once 2FA succeeds (or was not required) the
 * response includes the full user object and the access token.
 */
export type LoginResponse =
  | {
      twoFactorRequired: true;
      email: string;
    }
  | {
      twoFactorRequired: false;
      user: User;
      accessToken: string;
    };

/** Generic API error re-export for convenience. */
export { ApiError } from "@/lib/api";
