/**
 * Public, client-safe env config.
 * Anything secret or server-only must NOT live here.
 */
export const env = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    "http://localhost:5000/api/v1",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://profileai.app",
} as const;
