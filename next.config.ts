import type { NextConfig } from "next";

/**
 * Centralized, validated env access for `next.config.ts`.
 *
 * Anything consumed during build / at config time MUST go through this object
 * (process.env reads inside `next.config` are inlined at build, so we want
 * one canonical place to guard against missing values and bad URLs).
 */
const readEnv = (key: string, fallback: string): string => {
  const value = process.env[key];
  if (value && value.trim().length > 0) return value.trim();
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `[next.config] Missing required env var ${key}. ` +
        `Set it in your deployment environment or copy .env.example to .env.`
    );
  }
  return fallback;
};

const trimTrailingSlash = (url: string): string => url.replace(/\/+$/, "");

const API_BASE_URL = trimTrailingSlash(
  readEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:5000/api/v1")
);

const FRONTEND_URL = trimTrailingSlash(
  readEnv("NEXT_PUBLIC_FRONTEND_URL", "http://localhost:3000")
);

const BETTER_AUTH_URL = trimTrailingSlash(
  readEnv("NEXT_PUBLIC_BETTER_AUTH_URL", `${API_BASE_URL.replace(/\/api\/v\d+$/, "")}/api/auth`)
);

const CLOUDINARY_CLOUD_NAME = readEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "");
const CLOUDINARY_UPLOAD_PRESET = readEnv("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET", "");

const ENABLE_DEBUG = readEnv("NEXT_PUBLIC_ENABLE_DEBUG", "false") === "true";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // ─── Public env (inlined into the browser bundle) ──────
  // Centralizing these here means `process.env.NEXT_PUBLIC_*` reads anywhere
  // else in the app pick up consistent values, and build-time checks fail
  // loud in production if something is missing.
  env: {
    NEXT_PUBLIC_API_BASE_URL: API_BASE_URL,
    NEXT_PUBLIC_FRONTEND_URL: FRONTEND_URL,
    NEXT_PUBLIC_BETTER_AUTH_URL: BETTER_AUTH_URL,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: CLOUDINARY_UPLOAD_PRESET,
    NEXT_PUBLIC_ENABLE_DEBUG: ENABLE_DEBUG ? "true" : "false",
  },

  images: {
    // Allow template thumbnails served from MinIO / S3 / Cloudinary.
    // Add your production host(s) here as you deploy.
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "minio.*" },
    ],
  },

  // ─── Security headers (defense in depth on top of helmet in the API) ───
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // ─── CORS-friendly rewrite for direct API hits from the browser ───
  // If you ever call the API without going through `lib/api.ts`, this
  // proxies `/api/proxy/*` to the backend. Auth/cookie flows should still
  // hit the backend directly so `credentials: 'include'` works.
  async rewrites() {
    const target = API_BASE_URL.replace(/\/api\/v\d+$/, "");
    return [
      { source: "/api/proxy/:path*", destination: `${target}/api/:path*` },
    ];
  },
};

export default nextConfig;
