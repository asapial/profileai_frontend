// Server-side fetcher for admin endpoints.
//
// We can't use the browser `api` client (which uses `credentials:
// "include"` to forward cookies on the browser side) from React Server
// Components — the cookie store there is read via `next/headers` and
// needs to be forwarded on the outgoing `fetch` manually. This helper
// builds the same URL + JSON contract as the client `api` client and
// forwards the `accessToken` cookie as a `Cookie` header so the Express
// `checkAuth` middleware authorizes the request.
//
// Admin-only — every call hits `/api/v1/admin/*` on the backend.

import "server-only";

import { cookies } from "next/headers";

import { env } from "@/lib/env";

type Json = Record<string, unknown> | unknown[] | null;

type ServerResponse<T> = {
  status: number;
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

class ServerApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ServerApiError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const store = await cookies();
  const cookieHeader = [
    store.get("accessToken")?.value
      ? `accessToken=${store.get("accessToken")?.value}`
      : null,
    store.get("refreshToken")?.value
      ? `refreshToken=${store.get("refreshToken")?.value}`
      : null,
  ]
    .filter(Boolean)
    .join("; ");

  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(init.headers ?? {}),
    },
    // Server components can use the Next data cache; admin data is short
    // lived anyway. 60s revalidation is consistent with the client
    // default `staleTime`.
    next: { revalidate: 60, tags: [path] },
  });

  let payload: ServerResponse<T> | null = null;
  try {
    payload = (await res.json()) as ServerResponse<T>;
  } catch {
    // ignore — handled below
  }

  if (!res.ok || !payload || payload.success !== true) {
    const message =
      payload?.message || `Request failed with status ${res.status}`;
    throw new ServerApiError(message, res.status);
  }

  return { data: payload.data, meta: payload.meta };
}

export const adminApi = {
  get: <T,>(path: string) => request<T>(path, { method: "GET" }),
  put: <T,>(path: string, body: Json) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: <T,>(path: string, body: Json) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  post: <T,>(path: string, body: Json) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  delete: <T,>(path: string, body?: Json) =>
    request<T>(path, {
      method: "DELETE",
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
};

export { ServerApiError };
