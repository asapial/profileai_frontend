"use client";

// Admin Template Editor (A-P7).
//
// Same shape as A-P6 (metadata + layout + preview) but loaded from the
// existing template, supports rollback to a specific history snapshot,
// and surfaces the version history sidebar against the right gutter.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconClock,
  IconDeviceFloppy,
  IconHistory,
  IconRocket,
  IconTrash,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminTemplate,
  useAdminTemplateHistory,
  useUpdateTemplate,
  type TemplateCategory,
  type TemplateLayoutConfig,
} from "@/lib/hooks/useAdminTemplates";

const CATEGORIES: TemplateCategory[] = [
  "MODERN",
  "CLASSIC",
  "CREATIVE",
  "MINIMAL",
  "EXECUTIVE",
  "TECHNICAL",
  "ACADEMIC",
];

type PreviewResume = {
  name: string;
  title: string;
  email: string;
  summary: string;
  experience: Array<{
    role: string;
    company: string;
    period: string;
    bullets: string[];
  }>;
  skills: string[];
};

const SAMPLE_DATA: PreviewResume = {
  name: "Jordan Rivera",
  title: "Senior Product Engineer",
  email: "jordan@example.com",
  summary:
    "Full-stack engineer with 7 years building consumer SaaS products end to end.",
  experience: [
    {
      role: "Senior Product Engineer",
      company: "Acme Co",
      period: "2023 — Present",
      bullets: [
        "Owned the onboarding funnel, lifting activation by 22%.",
        "Migrated the billing surface to TypeScript and Stripe.",
      ],
    },
    {
      role: "Product Engineer",
      company: "Initech",
      period: "2020 — 2023",
      bullets: ["Shipped 14 product surfaces used by 200k users."],
    },
  ],
  skills: ["TypeScript", "Next.js", "Postgres", "Stripe", "GraphQL"],
};

export function AdminTemplateEditClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: template, isLoading } = useAdminTemplate(id);
  const { data: history } = useAdminTemplateHistory(id);
  const update = useUpdateTemplate(id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("MODERN");
  const [isAtsFriendly, setIsAtsFriendly] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [accentColor, setAccentColor] = useState("#1F4E79");
  const [spacing, setSpacing] = useState<TemplateLayoutConfig["spacing"]>(
    "comfortable",
  );
  const [sectionOrder, setSectionOrder] = useState<string[]>([
    "summary",
    "experience",
    "skills",
  ]);
  const [dirty, setDirty] = useState(false);

  // Hydrate form from server-loaded template.
  useEffect(() => {
    if (!template) return;
    setName(template.name);
    setDescription(template.description ?? "");
    setCategory(template.category);
    setIsAtsFriendly(template.isAtsFriendly);
    setThumbnailUrl(template.thumbnailUrl ?? "");
    setFontFamily(template.layoutConfig.fontFamily ?? "Inter");
    setAccentColor(template.layoutConfig.accentColor ?? "#1F4E79");
    setSpacing(template.layoutConfig.spacing ?? "comfortable");
    setSectionOrder(
      template.layoutConfig.sectionOrder ?? [
        "summary",
        "experience",
        "skills",
      ],
    );
    setDirty(false);
  }, [template]);

  const layoutConfig: TemplateLayoutConfig = useMemo(
    () => ({ fontFamily, accentColor, spacing, sectionOrder }),
    [fontFamily, accentColor, spacing, sectionOrder],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,260px)]">
          <Skeleton className="h-[480px]" />
          <Skeleton className="h-[480px]" />
          <Skeleton className="h-[480px]" />
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="p-6 text-sm">Template not found.</Card>
      </div>
    );
  }

  async function save(activateImmediately: boolean) {
    if (!name.trim()) return;
    try {
      await update.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        category,
        isAtsFriendly,
        thumbnailUrl: thumbnailUrl.trim() || null,
        layoutConfig,
      });
      toast.success(
        activateImmediately
          ? "Template updated and activated."
          : "Changes saved.",
      );
      setDirty(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/templates">
              <IconArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit · {template.name}
          </h1>
          {template.isActive ? (
            <Badge>Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
          {template.isDefault ? <Badge variant="outline">Default</Badge> : null}
          {dirty ? (
            <Badge variant="destructive">Unsaved changes</Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => save(false)}
            disabled={update.isPending || !name.trim()}
          >
            <IconDeviceFloppy className="mr-1.5 size-4" />
            Save
          </Button>
          <Button
            onClick={() => save(true)}
            disabled={update.isPending || !name.trim()}
          >
            <IconRocket className="mr-1.5 size-4" />
            Save &amp; activate
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,260px)]">
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-base font-semibold">Metadata</h2>
          <Separator />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v as TemplateCategory);
                  setDirty(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                value={thumbnailUrl}
                onChange={(e) => {
                  setThumbnailUrl(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={isAtsFriendly}
                onChange={(e) => {
                  setIsAtsFriendly(e.target.checked);
                  setDirty(true);
                }}
                className="size-4 accent-primary"
              />
              <span>ATS-friendly</span>
            </label>
          </div>

          <h2 className="text-base font-semibold">Layout &amp; design</h2>
          <Separator />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="font">Font</Label>
              <Input
                id="font"
                value={fontFamily}
                onChange={(e) => {
                  setFontFamily(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="accent">Accent</Label>
              <div className="flex items-center gap-2">
                <input
                  id="accent"
                  type="color"
                  value={accentColor}
                  onChange={(e) => {
                    setAccentColor(e.target.value);
                    setDirty(true);
                  }}
                  className="h-10 w-12 cursor-pointer rounded border border-border bg-background"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => {
                    setAccentColor(e.target.value);
                    setDirty(true);
                  }}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label>Spacing</Label>
              <Select
                value={spacing}
                onValueChange={(v) => {
                  setSpacing(v as TemplateLayoutConfig["spacing"]);
                  setDirty(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="airy">Airy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-base font-semibold">Preview</h2>
          <Separator />
          <PreviewPane layoutConfig={layoutConfig} />
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">History</h2>
            <IconHistory className="text-muted-foreground size-4" />
          </div>
          <Separator />
          {!history || history.length === 0 ? (
            <p className="text-muted-foreground text-sm">No versions yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((h, i) => (
                <li
                  key={h.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-border/60 p-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium">
                      v{history.length - i}
                      {i === 0 ? " · current" : ""}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      <IconClock className="mr-1 inline size-3" />
                      {formatDistanceToNow(new Date(h.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {h.changedBy ? (
                      <span className="text-muted-foreground text-[10px]">
                        by {h.changedBy}
                      </span>
                    ) : null}
                  </div>
                  {i !== 0 ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        // Restore snapshot by saving it back as the new
                        // current version. Keep last writer by
                        // hydrating fields from h.layoutConfig.
                        setFontFamily(
                          (h.layoutConfig.fontFamily as string) ?? "Inter",
                        );
                        setAccentColor(
                          (h.layoutConfig.accentColor as string) ??
                            "#1F4E79",
                        );
                        setSpacing(
                          (h.layoutConfig.spacing as TemplateLayoutConfig["spacing"]) ??
                            "comfortable",
                        );
                        setSectionOrder(
                          Array.isArray(h.layoutConfig.sectionOrder)
                            ? (h.layoutConfig.sectionOrder as string[])
                            : ["summary", "experience", "skills"],
                        );
                        if (h.name) setName(h.name);
                        setDirty(true);
                        toast(
                          "Snapshot staged. Click Save to make it current.",
                        );
                      }}
                    >
                      <IconTrash className="mr-1 size-3" />
                      Restore
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function PreviewPane({ layoutConfig }: { layoutConfig: TemplateLayoutConfig }) {
  const fontFamily = layoutConfig.fontFamily ?? "Inter";
  const accent = layoutConfig.accentColor ?? "#1F4E79";
  const spacing = layoutConfig.spacing ?? "comfortable";
  const py =
    spacing === "compact" ? "py-1" : spacing === "airy" ? "py-4" : "py-2";
  return (
    <div
      className="rounded-md border border-border/60 bg-white p-5 text-xs leading-relaxed text-zinc-800"
      style={{ fontFamily }}
    >
      <div className="border-b border-zinc-200 pb-2">
        <div className="text-base font-semibold" style={{ color: accent }}>
          {SAMPLE_DATA.name}
        </div>
        <div className="text-xs text-zinc-600">{SAMPLE_DATA.title}</div>
        <div className="text-[10px] text-zinc-500">{SAMPLE_DATA.email}</div>
      </div>
      <div className={py}>
        <SectionHeading label="Summary" color={accent} />
        <p className="text-xs text-zinc-700">{SAMPLE_DATA.summary}</p>
      </div>
      <div className={py}>
        <SectionHeading label="Experience" color={accent} />
        {SAMPLE_DATA.experience.map((e, i) => (
          <div key={i} className="mt-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{e.role}</span>
              <span className="text-[10px] text-zinc-500">{e.period}</span>
            </div>
            <div className="text-[11px] text-zinc-600">{e.company}</div>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-zinc-700">
              {e.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className={py}>
        <SectionHeading label="Skills" color={accent} />
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_DATA.skills.map((s) => (
            <span
              key={s}
              className="rounded px-1.5 py-0.5 text-[10px]"
              style={{ backgroundColor: `${accent}1A`, color: accent }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <div
      className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color }}
    >
      {label}
    </div>
  );
}