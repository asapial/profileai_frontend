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
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    // Public landing endpoints should be cache-friendly.
    next: { revalidate: 300 },
  });

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
