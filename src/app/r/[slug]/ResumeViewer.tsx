"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { env } from "@/lib/env";

const apiBase = env.apiBaseUrl;

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

// ─── Handlebars-lite interpolator ────────────────────────────────────────────
// Supports the subset our templates use:
//   - {{var}}                        — simple variable
//   - {{{var}}}                      — triple-stash (same as {{var}} here, since
//                                       React dangerouslySetInnerHTML already
//                                       renders the result as HTML)
//   - {{#if cond}}…{{/if}}           — conditional block
//   - {{#each list}}…{{/each}}       — iteration over an array
//   - {{this}} / {{this.field}}      — current item inside an each
// We deliberately keep this small and dependency-free. If templates grow to
// use partials/helpers, swap this for a real Handlebars build at build time.

function getPath(obj: unknown, path: string): unknown {
  if (obj == null) return undefined;
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

// `scope` is a chain of data objects, outermost first. Lookups walk from the
// innermost (most recent) scope outward, so `{{this.x}}` inside an each sees
// the current item while `{{name}}` still sees the top-level contentData.
function lookupValue(scope: Record<string, unknown>[], path: string): unknown {
  if (!path) return undefined;
  // `this.foo` / `this` always resolves against the innermost scope's `this`
  // entry, mirroring Handlebars' current-item semantics.
  if (path === "this") {
    for (let s = scope.length - 1; s >= 0; s--) {
      const obj = scope[s];
      if (obj != null && "this" in obj) {
        return (obj as Record<string, unknown>)["this"];
      }
    }
    return undefined;
  }
  if (path.startsWith("this.")) {
    const rest = path.slice(5);
    for (let s = scope.length - 1; s >= 0; s--) {
      const obj = scope[s];
      if (obj != null && "this" in obj) {
        return getPath((obj as Record<string, unknown>)["this"], rest);
      }
    }
    return undefined;
  }
  // Plain path: walk scopes from innermost outward for a direct key match,
  // then fall back to dotted-path traversal on the innermost scope.
  for (let s = scope.length - 1; s >= 0; s--) {
    const obj = scope[s];
    if (obj != null && path in obj) {
      return (obj as Record<string, unknown>)[path];
    }
  }
  return getPath(scope[scope.length - 1], path);
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderScalar(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return htmlEscape(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return htmlEscape(JSON.stringify(v));
}

function interpolate(
  template: string,
  scope: Record<string, unknown>[],
): string {
  // Walk the template left-to-right. For each opening token we find its
  // matching close (counting nested same-type opens) and recurse on the body.
  let out = "";
  let i = 0;
  const N = template.length;

  const findClosing = (
    startAfter: number,
    open: string,
    close: string,
  ): number => {
    let depth = 1;
    let j = startAfter;
    while (j < N) {
      const nextOpen = template.indexOf(open, j);
      const nextClose = template.indexOf(close, j);
      if (nextClose === -1) return -1;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        j = nextOpen + open.length;
      } else {
        depth--;
        if (depth === 0) return nextClose;
        j = nextClose + close.length;
      }
    }
    return -1;
  };

  while (i < N) {
    // {{#if X}} … {{/if}}
    const ifMatch = template.slice(i).match(/^\{\{#if\s+([^{}]+)\}\}/);
    if (ifMatch) {
      const condPath = ifMatch[1].trim();
      const blockStart = i + ifMatch[0].length;
      const blockEnd = findClosing(blockStart, "{{#if", "{{/if}}");
      if (blockEnd === -1) {
        out += template.slice(i);
        return out;
      }
      const inner = template.slice(blockStart, blockEnd);
      const truthy = Boolean(lookupValue(scope, condPath));
      if (truthy) out += interpolate(inner, scope);
      i = blockEnd + "{{/if}}".length;
      continue;
    }

    // {{#each X}} … {{/each}}
    const eachMatch = template.slice(i).match(/^\{\{#each\s+([^{}]+)\}\}/);
    if (eachMatch) {
      const listPath = eachMatch[1].trim();
      const blockStart = i + eachMatch[0].length;
      const blockEnd = findClosing(blockStart, "{{#each", "{{/each}}");
      if (blockEnd === -1) {
        out += template.slice(i);
        return out;
      }
      const inner = template.slice(blockStart, blockEnd);
      const list = lookupValue(scope, listPath);
      if (Array.isArray(list)) {
        for (const item of list) {
          // Expose the current item as `this` for `{{this}}` / `{{this.field}}`
          // — Handlebars semantics. Also splice the item's own keys into the
          // innermost scope so plain `{{company}}` works inside the each.
          if (item != null && typeof item === "object") {
            out += interpolate(inner, [
              ...scope,
              { this: item, ...(item as Record<string, unknown>) },
            ]);
          } else {
            out += interpolate(inner, [...scope, { this: item as unknown }]);
          }
        }
      }
      i = blockEnd + "{{/each}}".length;
      continue;
    }

    // {{!comment}} — strip
    const commentMatch = template.slice(i).match(/^\{\{![^]*?\}\}/);
    if (commentMatch) {
      i += commentMatch[0].length;
      continue;
    }

    // {{{var}}} or {{var}}. Inner must contain no `{` or `}`.
    const varMatch = template
      .slice(i)
      .match(/^\{\{\{\s*([^{}]+)\s*\}\}|^\{\{\s*([^{}]+)\s*\}\}/);
    if (varMatch) {
      const path = (varMatch[1] ?? varMatch[2] ?? "").trim();
      // Guard against block tokens we didn't handle.
      if (path.startsWith("#") || path.startsWith("/") || path.startsWith("!")) {
        out += template[i];
        i++;
        continue;
      }
      const value = lookupValue(scope, path);
      out += renderScalar(value);
      i += varMatch[0].length;
      continue;
    }

    out += template[i];
    i++;
  }
  return out;
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  data: PublicResume;
};

export function ResumeViewer({ data }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Fire-and-forget view tracker once the page mounts.
  useEffect(() => {
    track({
      name: "public_resume_view",
      properties: { slug: data.slug, template: data.template.id },
    });
    void fetch(
      `${apiBase}/public/resumes/${encodeURIComponent(data.slug)}/track-view`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "view" }),
        keepalive: true,
      },
    ).catch(() => {
      /* swallow — analytics is best-effort */
    });
  }, [data.slug, data.template.id]);

  const renderedHtml = useMemo(() => {
    try {
      return interpolate(data.template.htmlLayout, [data.contentData ?? {}]);
    } catch {
      return `<p style="color:#b91c1c;padding:24px">This resume could not be rendered.</p>`;
    }
  }, [data.template.htmlLayout, data.contentData]);

  const onDownload = async () => {
    setDownloadError(null);
    setDownloading(true);
    try {
      const res = await fetch(
        `${apiBase}/public/resumes/${encodeURIComponent(data.slug)}/pdf`,
      );
      const payload = (await res.json().catch(() => null)) as
        | { success: boolean; data?: { presignedUrl: string } }
        | null;
      if (!res.ok || !payload?.data?.presignedUrl) {
        throw new Error("Download failed. Please try again.");
      }
      track({ name: "public_resume_download", properties: { slug: data.slug } });
      // Open in a new tab so the user keeps the viewer open.
      window.open(payload.data.presignedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Floating action bar — small ProFile AI branding + download CTA */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              {data.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {data.hasPdf && (
              <button
                type="button"
                onClick={onDownload}
                disabled={downloading}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-sm transition hover:opacity-90 disabled:opacity-50 sm:text-sm",
                )}
              >
                <Download className="h-3.5 w-3.5" />
                {downloading ? "Preparing…" : "Download PDF"}
              </button>
            )}
            <a
              href="https://profileai.app"
              className="hidden text-xs font-semibold text-muted-foreground hover:text-foreground sm:inline"
            >
              Made with ProFile AI
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Inline template CSS — scoped to the resume sheet via a wrapper. */}
        <style dangerouslySetInnerHTML={{ __html: data.template.cssStyles }} />

        {/* Resume "page" — white A4 sheet on a soft background. */}
        <article className="resume-sheet mx-auto bg-card shadow-sm ring-1 ring-border/60 print:shadow-none print:ring-0">
          <div
            className="resume-sheet__inner"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </article>

        {/* Footer meta: view count + score + template name */}
        <div className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
            <Eye className="h-3 w-3" />
            {data.viewCount.toLocaleString()} {data.viewCount === 1 ? "view" : "views"}
          </span>
          {data.atsScore != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
              ATS score {data.atsScore}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
            Template · {data.template.name}
          </span>
        </div>

        {downloadError && (
          <p
            role="alert"
            className="mx-auto mt-4 max-w-md rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-700"
          >
            {downloadError}
          </p>
        )}
      </main>
    </div>
  );
}
