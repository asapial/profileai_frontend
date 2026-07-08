import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { ApiError, api } from "@/lib/api";
import { ResumeViewer } from "./ResumeViewer";

// Render on demand so per-resume metadata (noindex flag, view count) and
// upstream cache headers are honored on every request. The backend itself
// sets Cache-Control: public, max-age=60, stale-while-revalidate=300, so
// repeated hits are still cheap.
export const dynamic = "force-dynamic";

type PublicResume = {
  slug: string;
  title: string;
  contentData: Record<string, unknown>;
  atsScore: number | null;
  noindex: boolean;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
    htmlLayout: string;
    cssStyles: string;
  };
  viewCount: number;
  hasPdf: boolean;
};

async function fetchResume(slug: string): Promise<PublicResume | null> {
  try {
    return await api.get<PublicResume>(`/public/resumes/${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      return null;
    }
    // Surface other errors to the error boundary (e.g. 5xx from the backend).
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchResume(slug);
  if (!data) {
    return {
      title: "Resume not found — ProFile AI",
      robots: { index: false, follow: false },
    };
  }
  const title = `${data.title} — ProFile AI`;
  const description =
    typeof data.contentData?.summary === "string" && data.contentData.summary
      ? data.contentData.summary.slice(0, 160)
      : `${data.title} — a resume built with ProFile AI.`;

  return {
    title,
    description,
    robots: data.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${env.siteUrl}/r/${data.slug}`,
    },
  };
}

export default async function PublicResumePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchResume(slug);
  if (!data) notFound();

  return <ResumeViewer data={data} />;
}
