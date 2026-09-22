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

const FALLBACK_OVERVIEWS: Record<PublicPageSlug, { title: string; body: string }> = {
  about: {
    title: "About ProFile AI",
    body: "ProFile AI is a private career workspace for turning real experience into clear resumes, tailored applications, and confident next steps. Our tools are designed to support human judgment—not replace it.",
  },
  contact: {
    title: "Contact ProFile AI",
    body: "Choose the channel that matches your question so we can respond with the right context. Never send passwords, one-time codes, payment card details, or sensitive identity documents by email.",
  },
  blog: {
    title: "Career Notes",
    body: "Practical guidance for writing stronger career stories, understanding application systems, and making thoughtful decisions throughout a job search.",
  },
  terms: {
    title: "Terms of Service",
    body: "These terms explain the rules for using ProFile AI, the responsibilities attached to an account, and how subscriptions, user content, acceptable use, and service changes are handled.",
  },
  privacy: {
    title: "Privacy Policy",
    body: "This policy explains what information ProFile AI processes, why it is needed, how it is protected, and the choices available to access, correct, export, unpublish, or delete your data.",
  },
  cookies: {
    title: "Cookie Policy",
    body: "This policy explains the browser storage used for secure sign-in, preferences, product reliability, and optional measurement, together with the controls available to you.",
  },
};

function localPage(slug: PublicPageSlug): ContentPage {
  const definition = PUBLIC_PAGE_CONTENT[slug];
  const fallback = FALLBACK_OVERVIEWS[slug];
  return {
    slug,
    title: fallback.title,
    description: definition.heroDescription,
    body: fallback.body,
    updatedAt: "2026-09-19T00:00:00.000Z",
  };
}

async function loadPage(slug: string): Promise<ContentPage | null> {
  if (!ALLOWED.has(slug)) return null;

  const safeSlug = slug as PublicPageSlug;

  try {
    const response = await fetch(`${env.apiBaseUrl}/content/pages/${slug}`, {
      next: { revalidate: 300, tags: [`content-page-${slug}`] },
      signal: AbortSignal.timeout(4_000),
    });

    if (!response.ok) return localPage(safeSlug);
    const candidate = ((await response.json()) as { data?: ContentPage }).data;
    if (
      !candidate ||
      typeof candidate.title !== "string" ||
      typeof candidate.body !== "string" ||
      typeof candidate.updatedAt !== "string"
    ) {
      return localPage(safeSlug);
    }
    return candidate;
  } catch {
    return localPage(safeSlug);
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
