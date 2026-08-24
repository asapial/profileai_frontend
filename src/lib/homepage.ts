import { env } from "@/lib/env";

export type ManagedCta = { label: string; href: string };
export type ManagedHomepageItem = Record<
  string,
  string | number | boolean
>;
export type ManagedHomepageSection = {
  id: string;
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  items?: ManagedHomepageItem[];
  primaryCta?: ManagedCta;
  secondaryCta?: ManagedCta;
};
export type HomepageConfig = {
  site: {
    brandName: string;
    footerDescription: string;
    footerNote: string;
    socialLinks: Array<{ label: string; href: string }>;
  };
  navigation: Array<{
    label: string;
    href: string;
    children?: Array<{ label: string; href: string; description: string }>;
  }>;
  sectionOrder: string[];
  sections: ManagedHomepageSection[];
};
export type HomepageEditor = {
  id: string;
  draft: HomepageConfig;
  published: HomepageConfig;
  version: number;
  updatedBy: string | null;
  updatedAt: string;
  publishedAt: string | null;
};

export async function fetchHomepageContent(): Promise<HomepageConfig | null> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/content/homepage`, {
      next: { revalidate: 60, tags: ["homepage-content"] },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      success: boolean;
      data: HomepageConfig;
    };
    return payload.success ? payload.data : null;
  } catch {
    return null;
  }
}

export const sectionMap = (config: HomepageConfig | null) =>
  new Map((config?.sections ?? []).map((section) => [section.id, section]));
