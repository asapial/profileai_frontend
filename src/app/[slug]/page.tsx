import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicInfoPage } from "@/components/PublicInfoPage";
import { env } from "@/lib/env";
import {
  PUBLIC_PAGE_CONTENT,
  type PublicPageSlug,
} from "@/lib/public-page-content";

type ContentPage = {
  slug: string;
  title: string;
  description: string | null;
  body: string;
  updatedAt: string;
};

const ALLOWED = new Set(Object.keys(PUBLIC_PAGE_CONTENT));

async function loadPage(slug: string): Promise<ContentPage | null> {
  if (!ALLOWED.has(slug)) return null;

  try {
    const response = await fetch(`${env.apiBaseUrl}/content/pages/${slug}`, {
      next: { revalidate: 300, tags: [`content-page-${slug}`] },
    });

    if (!response.ok) return null;
    return ((await response.json()) as { data: ContentPage }).data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);

  return page
    ? { title: `${page.title} · ProFile AI`, description: page.description }
    : {};
}

export default async function PublicContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await loadPage(slug);

  if (!page) notFound();

  return (
    <PublicInfoPage
      page={page}
      definition={PUBLIC_PAGE_CONTENT[slug as PublicPageSlug]}
    />
  );
}
