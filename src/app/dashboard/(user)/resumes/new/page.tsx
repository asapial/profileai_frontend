"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Backwards-compatibility alias: the real wizard lives at /resume/create.
// Older links (and the templates gallery) used /resumes/new?template=...,
// so we forward any incoming query to the canonical route with the
// templateId search-param key the wizard actually reads.
export default function LegacyResumesNewRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const templateId =
      searchParams.get("templateId") ?? searchParams.get("template") ?? "";
    const qs = templateId
      ? `?templateId=${encodeURIComponent(templateId)}`
      : "";
    router.replace(`/resume/create${qs}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-8 text-sm text-muted-foreground">
      Opening the resume builder…
    </div>
  );
}
