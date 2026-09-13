"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { ExternalLink, Save, Send, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useAdminHomepage,
  usePublishHomepage,
  useSaveHomepage,
} from "@/lib/hooks/useAdminHomepage";
import type { HomepageConfig, ManagedHomepageSection } from "@/lib/homepage";

const ctaSchema = z.object({ label: z.string(), href: z.string() });
const homepageSchema = z.object({
  site: z.object({
    brandName: z.string(),
    footerDescription: z.string(),
    footerNote: z.string(),
    socialLinks: z.array(z.object({ label: z.string(), href: z.string() })),
  }),
  navigation: z.array(
    z.object({
      label: z.string(),
      href: z.string(),
      children: z
        .array(
          z.object({
            label: z.string(),
            href: z.string(),
            description: z.string(),
          }),
        )
        .optional(),
    }),
  ),
  sectionOrder: z.array(z.string()),
  sections: z.array(
    z.object({
      id: z.string(),
      enabled: z.boolean(),
      eyebrow: z.string(),
      title: z.string(),
      description: z.string(),
      items: z
        .array(
          z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
        )
        .optional(),
      primaryCta: ctaSchema.optional(),
      secondaryCta: ctaSchema.optional(),
    }),
  ),
});
export function HomepageEditorClient() {
  const homepage = useAdminHomepage();
  const save = useSaveHomepage();
  const publish = usePublishHomepage();
  const [source, setSource] = useState<string | null>(null);
  const editorSource =
    source ??
    (homepage.data ? JSON.stringify(homepage.data.draft, null, 2) : "");

  const parsed = useMemo(() => {
    try {
      const value = homepageSchema.parse(JSON.parse(editorSource));
      return { value, error: null };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Invalid JSON",
      };
    }
  }, [editorSource]);

  const updateSection = (
    id: string,
    change: Partial<ManagedHomepageSection>,
  ) => {
    if (!parsed.value) return;
    setSource(
      JSON.stringify(
        {
          ...parsed.value,
          sections: parsed.value.sections.map((section) =>
            section.id === id ? { ...section, ...change } : section,
          ),
        },
        null,
        2,
      ),
    );
  };
  const updateSite = (change: Partial<HomepageConfig["site"]>) => {
    if (!parsed.value) return;
    setSource(
      JSON.stringify(
        { ...parsed.value, site: { ...parsed.value.site, ...change } },
        null,
        2,
      ),
    );
  };
  const saveDraft = async () => {
    if (!parsed.value) return;
    try {
      await save.mutateAsync(parsed.value);
      toast.success("Homepage draft saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save draft",
      );
    }
  };

  const publishDraft = async () => {
    if (save.isPending || publish.isPending || !parsed.value) return;
    try {
      await save.mutateAsync(parsed.value);
      await publish.mutateAsync();
      toast.success("Homepage published");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish");
    }
  };

  if (homepage.isLoading) {
    return <div className="px-4 lg:px-6">Loading homepage editor…</div>;
  }
  if (!homepage.data) {
    return (
      <div className="px-4 lg:px-6 text-destructive">
        Homepage content is unavailable. Apply the latest database migration and
        run the core seed.
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Homepage</h1>
            <Badge variant="secondary">Version {homepage.data.version}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Shape your homepage, one section at a time. Save your draft before
            publishing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 size-4" />
              View live site
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setSource(JSON.stringify(homepage.data.published, null, 2))
            }
          >
            <RotateCcw className="mr-2 size-4" />
            Load published
          </Button>
          <Button
            variant="outline"
            disabled={!parsed.value || save.isPending || publish.isPending}
            onClick={saveDraft}
          >
            <Save className="mr-2 size-4" />
            Save draft
          </Button>
          <Button
            disabled={!parsed.value || save.isPending || publish.isPending}
            onClick={publishDraft}
          >
            <Send className="mr-2 size-4" />
            Publish
          </Button>
        </div>
      </div>

      {parsed.value && (
        <div className="grid items-start gap-6 xl:grid-cols-[280px_1fr]">
          <Card className="xl:sticky xl:top-20">
            <CardHeader>
              <CardTitle className="text-base">The essentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="grid gap-2 text-sm">
                Brand name
                <input
                  className="h-10 rounded-md border bg-background px-3"
                  value={parsed.value.site.brandName}
                  onChange={(event) =>
                    updateSite({ brandName: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-2 text-sm">
                Footer description
                <textarea
                  className="min-h-28 rounded-md border bg-background p-3"
                  value={parsed.value.site.footerDescription}
                  onChange={(event) =>
                    updateSite({ footerDescription: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-2 text-sm">
                Footer note
                <input
                  className="h-10 rounded-md border bg-background px-3"
                  value={parsed.value.site.footerNote}
                  onChange={(event) =>
                    updateSite({ footerNote: event.target.value })
                  }
                />
              </label>
              <p className="text-xs leading-6 text-muted-foreground">
                The studio uses seven focused sections. Navigation leads to the
                process, templates, pricing and help.
              </p>
            </CardContent>
          </Card>
          <div className="space-y-4">
            {[
              "hero",
              "workflow",
              "features",
              "templateGallery",
              "pricing",
              "faq",
              "finalCta",
            ].map((id, index) => {
              const section = parsed.value!.sections.find(
                (item) => item.id === id,
              );
              if (!section) return null;
              const names: Record<string, string> = {
                hero: "First impression",
                workflow: "How it works",
                features: "The toolkit",
                templateGallery: "Template collection",
                pricing: "Plans",
                faq: "Questions & answers",
                finalCta: "Closing invitation",
              };
              return (
                <details
                  key={id}
                  className="rounded-xl border bg-card"
                  open={id === "hero"}
                >
                  <summary className="cursor-pointer px-5 py-5 font-medium">
                    <span className="mr-4 text-xs text-primary">
                      0{index + 1}
                    </span>
                    {names[id]}
                    <span className="ml-3 text-xs font-normal text-muted-foreground">
                      {section.enabled ? "Visible" : "Hidden"}
                    </span>
                  </summary>
                  <div className="grid gap-5 border-t p-5">
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={(event) =>
                          updateSection(id, { enabled: event.target.checked })
                        }
                      />
                      Show this section
                    </label>
                    <label className="grid gap-2 text-sm">
                      Heading
                      <input
                        className="h-11 rounded-md border bg-background px-3"
                        value={section.title}
                        onChange={(event) =>
                          updateSection(id, { title: event.target.value })
                        }
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      Description
                      <textarea
                        className="min-h-24 rounded-md border bg-background p-3"
                        value={section.description}
                        onChange={(event) =>
                          updateSection(id, { description: event.target.value })
                        }
                      />
                    </label>
                    {section.primaryCta && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm">
                          Button label
                          <input
                            className="h-10 rounded-md border bg-background px-3"
                            value={section.primaryCta.label}
                            onChange={(event) =>
                              updateSection(id, {
                                primaryCta: {
                                  ...section.primaryCta!,
                                  label: event.target.value,
                                },
                              })
                            }
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          Button destination
                          <input
                            className="h-10 rounded-md border bg-background px-3"
                            value={section.primaryCta.href}
                            onChange={(event) =>
                              updateSection(id, {
                                primaryCta: {
                                  ...section.primaryCta!,
                                  href: event.target.value,
                                },
                              })
                            }
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      )}
      <details className="rounded-xl border bg-card">
        <summary className="cursor-pointer px-5 py-4 text-sm font-medium">
          Advanced content editor
        </summary>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Structured homepage content
              <span className="text-xs font-normal text-muted-foreground">
                {parsed.value?.sections.length ?? 0} sections
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              aria-label="Homepage content JSON"
              value={editorSource}
              onChange={(event) => setSource(event.target.value)}
              spellCheck={false}
              className="min-h-[65vh] w-full resize-y rounded-lg border bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none focus:ring-2 focus:ring-ring"
            />
            {parsed.error ? (
              <p className="mt-2 text-sm text-destructive">{parsed.error}</p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Section IDs must be unique. Set <code>enabled</code> to false to
                hide a section and reorder IDs in <code>sectionOrder</code> to
                change the live layout.
              </p>
            )}
          </CardContent>
        </Card>
      </details>
    </div>
  );
}
