"use client";

import { useMemo, useState } from "react";
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
import type { HomepageConfig } from "@/lib/homepage";

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
      const value = JSON.parse(editorSource) as HomepageConfig;
      return { value, error: null };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Invalid JSON",
      };
    }
  }, [editorSource]);

  const saveDraft = async () => {
    if (!parsed.value) return;
    try {
      await save.mutateAsync(parsed.value);
      toast.success("Homepage draft saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save draft");
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
        Homepage content is unavailable. Apply the latest database migration
        and run the core seed.
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
            Edit every section, navigation item, CTA, footer link and display
            order. Saving creates a draft; publishing makes it public.
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
            disabled={!parsed.value || save.isPending}
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
    </div>
  );
}
