"use client";

// Admin Template Creation (A-P6).
//
// Metadata form + layout-config editor + live preview pane. Save as
// inactive draft (default) or activate immediately. Preview re-renders
// against canned sample data identical in shape to real resume data.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconEye,
  IconRocket,
} from "@tabler/icons-react";
import Link from "next/link";
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
import {
  useCreateTemplate,
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

export function AdminTemplateCreateClient() {
  const router = useRouter();
  const create = useCreateTemplate();

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

  const layoutConfig: TemplateLayoutConfig = useMemo(
    () => ({ fontFamily, accentColor, spacing, sectionOrder }),
    [fontFamily, accentColor, spacing, sectionOrder],
  );

  const canSave =
    name.trim().length >= 2 && (layoutConfig.fontFamily?.length ?? 0) > 0;

  async function save(activateImmediately: boolean) {
    if (!canSave) return;
    try {
      const result = await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        category,
        isAtsFriendly,
        layoutConfig,
        thumbnailUrl: thumbnailUrl.trim() || null,
        activateImmediately,
      });
      toast.success(
        activateImmediately
          ? "Template created and activated."
          : "Template saved as draft.",
      );
      router.push(`/admin/templates/${result.id}/edit`);
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
              Back to templates
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create template
          </h1>
          <Badge variant="secondary">Draft by default</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => save(false)}
            disabled={!canSave || create.isPending}
          >
            <IconDeviceFloppy className="mr-1.5 size-4" />
            Save draft
          </Button>
          <Button
            onClick={() => save(true)}
            disabled={!canSave || create.isPending}
          >
            <IconRocket className="mr-1.5 size-4" />
            Save &amp; activate
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-base font-semibold">Metadata</h2>
          <Separator />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Executive Bold"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short pitch shown on the gallery card"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as TemplateCategory)}
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
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="Optional — placeholder until upload"
              />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={isAtsFriendly}
                onChange={(e) => setIsAtsFriendly(e.target.checked)}
                className="size-4 accent-primary"
              />
              <span>ATS-friendly layout</span>
            </label>
          </div>

          <h2 className="text-base font-semibold">Layout &amp; design</h2>
          <Separator />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="font">Font family</Label>
              <Input
                id="font"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                placeholder="Inter"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="accent">Accent color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="accent"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded border border-border bg-background"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Spacing</Label>
              <Select
                value={spacing}
                onValueChange={(v) =>
                  setSpacing(v as TemplateLayoutConfig["spacing"])
                }
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
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label>Section order</Label>
              <div className="flex flex-wrap items-center gap-2">
                {sectionOrder.map((s, i) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      const next = [...sectionOrder];
                      [next[i], next[i - 1]] = [next[i - 1], next[i]];
                      setSectionOrder(next.filter(Boolean));
                    }}
                    title="Click to swap with previous"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
              <span className="text-muted-foreground text-xs">
                Tap a section to swap with the one before it. Section order
                affects every resume rendered with this template.
              </span>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Preview</h2>
            <IconEye className="text-muted-foreground size-4" />
          </div>
          <Separator />
          <PreviewPane layoutConfig={layoutConfig} />
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
        <div
          className="text-base font-semibold"
          style={{ color: accent }}
        >
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