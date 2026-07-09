import { env } from "./env";

export type ApiSuccess<T> = {
  status: number;
  success: true;
  message: string;
  data: T;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Only GETs should opt-in to Next's data cache. POSTs / mutations must not
  // be cached or they could be replayed and would also pin response bodies in
  // shared cache entries.
  const method = (init?.method ?? "GET").toUpperCase();
  const fetchInit: RequestInit = {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    // ── Auth-critical ────────────────────────────────────────────────────
    // The backend sets `accessToken` / `refreshToken` as httpOnly cookies
    // on a different origin (frontend :3000 → backend :5000). The browser
    // default for `credentials` is `"omit"`, which silently drops the
    // `Set-Cookie` response header. We need `"include"` so the browser
    // (a) accepts the cookies and (b) sends them back on every subsequent
    // request. Callers can still override via `init.credentials`.
    credentials: init?.credentials ?? "include",
    // `next` is a Next.js extension; cast keeps the standard RequestInit
    // type clean while still letting us opt into the data cache for GETs.
    ...(method === "GET" ? { next: { revalidate: 300 } } : {}),
  } as RequestInit;
  const res = await fetch(`${env.apiBaseUrl}${path}`, fetchInit);

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON body — ignore.
  }

  if (!res.ok) {
    const message =
      (payload as { message?: string })?.message ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return (payload as ApiSuccess<T>).data;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      ...(body !== undefined
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    }),
};

// ─── Template DTO ─────────────────────────────────────
export type TemplateCategory =
  | "MODERN"
  | "CLASSIC"
  | "CREATIVE"
  | "MINIMAL"
  | "EXECUTIVE"
  | "TECHNICAL"
  | "ACADEMIC";

export type FeaturedTemplate = {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string;
  category: TemplateCategory;
  isDefault: boolean;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  _count: { resumes: number };
};

export const fetchFeaturedTemplates = () =>
  api.get<FeaturedTemplate[]>("/templates?featured=true");
