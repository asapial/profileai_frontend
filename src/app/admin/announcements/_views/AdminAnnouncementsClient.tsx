"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  IconCheck,
  IconEye,
  IconMegaphone,
  IconPencil,
  IconPlus,
  IconPower,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type Announcement,
  type AnnouncementAudience,
  type AnnouncementStatus,
  type AnnouncementSeverity,
  useAdminAnnouncements,
  useCreateAnnouncement,
  usePublishAnnouncement,
  useRetireAnnouncement,
  useUpdateAnnouncement,
} from "@/lib/hooks/useAdminAnnouncements";

type Draft = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  severity: AnnouncementSeverity;
  publishAt: string;
  expiresAt: string;
  planIds: string;
  regions: string;
  signupAgeMin: string;
  signupAgeMax: string;
};

const EMPTY: Draft = {
  title: "",
  body: "",
  ctaLabel: "",
  ctaUrl: "",
  severity: "INFO",
  publishAt: "",
  expiresAt: "",
  planIds: "",
  regions: "",
  signupAgeMin: "",
  signupAgeMax: "",
};

const STATUS_TABS: Array<{ key: AnnouncementStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "DRAFT", label: "Drafts" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "LIVE", label: "Live" },
  { key: "EXPIRED", label: "Expired" },
];

const SEVERITY_VARIANT: Record<
  AnnouncementSeverity,
  "default" | "secondary" | "destructive" | "outline"
> = {
  INFO: "secondary",
  SUCCESS: "default",
  WARNING: "outline",
  DANGER: "destructive",
};

const SEVERITY_BG: Record<AnnouncementSeverity, string> = {
  INFO: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
  SUCCESS: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  WARNING: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  DANGER: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

function audienceFromDraft(d: Draft): AnnouncementAudience {
  return {
    planIds: d.planIds ? d.planIds.split(",").map((s) => s.trim()).filter(Boolean) : [],
    regions: d.regions ? d.regions.split(",").map((s) => s.trim()).filter(Boolean) : [],
    signupAgeDays:
      d.signupAgeMin || d.signupAgeMax
        ? {
            min: Number(d.signupAgeMin) || 0,
            max: Number(d.signupAgeMax) || Number.MAX_SAFE_INTEGER,
          }
        : null,
  };
}

function statusVariant(s: AnnouncementStatus) {
  switch (s) {
    case "LIVE":
      return "default" as const;
    case "SCHEDULED":
      return "secondary" as const;
    case "DRAFT":
      return "outline" as const;
    case "EXPIRED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export function AdminAnnouncementsClient() {
  const { data, isLoading } = useAdminAnnouncements();
  const announcements = useMemo(() => data ?? [], [data]);

  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "ALL">(
    "ALL",
  );
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<Draft | null>(null);

  const create = useCreateAnnouncement();
  const update = useUpdateAnnouncement(editingId ?? "");
  const publish = usePublishAnnouncement("");
  const retire = useRetireAnnouncement("");

  const visible = useMemo(
    () =>
      statusFilter === "ALL"
        ? announcements
        : announcements.filter((a) => a.status === statusFilter),
    [announcements, statusFilter],
  );

  function populateDraft(a: Announcement) {
    setEditingId(a.id);
    setDraft({
      title: a.title,
      body: a.body,
      ctaLabel: a.ctaLabel ?? "",
      ctaUrl: a.ctaUrl ?? "",
      severity: a.severity,
      publishAt: a.publishAt ? a.publishAt.slice(0, 16) : "",
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 16) : "",
      planIds: a.audience.planIds.join(", "),
      regions: a.audience.regions.join(", "),
      signupAgeMin: a.audience.signupAgeDays
        ? String(a.audience.signupAgeDays.min)
        : "",
      signupAgeMax: a.audience.signupAgeDays
        ? String(
            a.audience.signupAgeDays.max === Number.MAX_SAFE_INTEGER
              ? ""
              : a.audience.signupAgeDays.max,
          )
        : "",
    });
  }

  async function save() {
    if (!draft.title.trim() || !draft.body.trim()) {
      toast.error("Title and body are required.");
      return;
    }
    const payload = {
      title: draft.title.trim(),
      body: draft.body,
      ctaLabel: draft.ctaLabel.trim() || null,
      ctaUrl: draft.ctaUrl.trim() || null,
      severity: draft.severity,
      publishAt: draft.publishAt ? new Date(draft.publishAt).toISOString() : null,
      expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : null,
      status: "DRAFT" as AnnouncementStatus,
      audience: audienceFromDraft(draft),
    };
    try {
      if (editingId) {
        await update.mutateAsync(payload);
        toast.success("Announcement saved.");
      } else {
        await create.mutateAsync(payload);
        toast.success("Announcement created.");
      }
      setDraft(EMPTY);
      setEditingId(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground text-sm">
            Banner messages and lifecycle broadcasts shown to specific audiences.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setDraft(EMPTY);
          }}
        >
          <IconPlus className="mr-1.5 size-4" />
          New announcement
        </Button>
      </div>

      <div className="inline-flex overflow-hidden rounded-md border">
        {STATUS_TABS.map((t, i) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setStatusFilter(t.key)}
            className={`px-4 py-2 text-sm ${
              statusFilter === t.key ? "bg-muted font-medium" : ""
            } ${i > 0 ? "border-l" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <IconMegaphone className="text-muted-foreground size-8" />
            <div className="text-sm font-medium">No announcements</div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Reach</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{a.title}</span>
                      <span className="text-muted-foreground line-clamp-1 text-xs">
                        {a.body}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={SEVERITY_VARIANT[a.severity]}>
                      {a.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {a.publishAt ? new Date(a.publishAt).toLocaleString() : "—"}
                    {" → "}
                    {a.expiresAt ? new Date(a.expiresAt).toLocaleString() : "∞"}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{a.impressions.toLocaleString()} views</div>
                    <div className="text-muted-foreground text-xs">
                      {a.clicks.toLocaleString()} clicks
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setPreviewing({
                            title: a.title,
                            body: a.body,
                            ctaLabel: a.ctaLabel ?? "",
                            ctaUrl: a.ctaUrl ?? "",
                            severity: a.severity,
                            publishAt: a.publishAt ?? "",
                            expiresAt: a.expiresAt ?? "",
                            planIds: a.audience.planIds.join(", "),
                            regions: a.audience.regions.join(", "),
                            signupAgeMin: "",
                            signupAgeMax: "",
                          })
                        }
                      >
                        <IconEye className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => populateDraft(a)}
                      >
                        <IconPencil className="size-4" />
                      </Button>
                      <AnnouncementActions
                        announcement={a}
                        onPublish={publish.mutateAsync}
                        onRetire={retire.mutateAsync}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-base font-semibold">
          {editingId ? "Edit announcement" : "Compose announcement"}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>Title</Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>Body</Label>
            <textarea
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              rows={4}
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Severity</Label>
            <div className="inline-flex overflow-hidden rounded-md border">
              {(
                ["INFO", "SUCCESS", "WARNING", "DANGER"] as AnnouncementSeverity[]
              ).map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, severity: s }))}
                  className={`px-3 py-1.5 text-sm ${
                    draft.severity === s ? "bg-muted font-medium" : ""
                  } ${i > 0 ? "border-l" : ""}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>CTA label</Label>
            <Input
              value={draft.ctaLabel}
              onChange={(e) =>
                setDraft((d) => ({ ...d, ctaLabel: e.target.value }))
              }
              placeholder="Learn more"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>CTA URL</Label>
            <Input
              value={draft.ctaUrl}
              onChange={(e) => setDraft((d) => ({ ...d, ctaUrl: e.target.value }))}
              placeholder="/upgrade"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Publish at</Label>
            <Input
              type="datetime-local"
              value={draft.publishAt}
              onChange={(e) => setDraft((d) => ({ ...d, publishAt: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Expires at</Label>
            <Input
              type="datetime-local"
              value={draft.expiresAt}
              onChange={(e) => setDraft((d) => ({ ...d, expiresAt: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Audience plan IDs</Label>
            <Input
              value={draft.planIds}
              onChange={(e) => setDraft((d) => ({ ...d, planIds: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Audience regions</Label>
            <Input
              value={draft.regions}
              onChange={(e) => setDraft((d) => ({ ...d, regions: e.target.value }))}
              placeholder="US, EU"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>New-user min age (days)</Label>
            <Input
              type="number"
              value={draft.signupAgeMin}
              onChange={(e) =>
                setDraft((d) => ({ ...d, signupAgeMin: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>New-user max age (days)</Label>
            <Input
              type="number"
              value={draft.signupAgeMax}
              onChange={(e) =>
                setDraft((d) => ({ ...d, signupAgeMax: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={() => setPreviewing(draft)}>
            <IconEye className="mr-1.5 size-4" />
            Preview banner
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDraft(EMPTY);
                setEditingId(null);
              }}
            >
              Reset
            </Button>
            <Button
              onClick={save}
              disabled={create.isPending || update.isPending}
            >
              <IconCheck className="mr-1.5 size-4" />
              {editingId ? "Save changes" : "Save draft"}
            </Button>
          </div>
        </div>
      </Card>

      {previewing ? (
        <Card className="p-4">
          <div className="text-muted-foreground mb-2 text-xs">Preview</div>
          <div
            className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 ${SEVERITY_BG[previewing.severity]}`}
          >
            <div className="flex flex-col gap-0.5">
              <div className="text-sm font-semibold">{previewing.title || "Title"}</div>
              <div className="text-xs">{previewing.body || "Body"}</div>
            </div>
            {previewing.ctaLabel ? (
              <Button size="sm" variant="outline">
                {previewing.ctaLabel}
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function AnnouncementActions({
  announcement,
  onPublish,
  onRetire,
}: {
  announcement: Announcement;
  onPublish: () => Promise<unknown>;
  onRetire: () => Promise<unknown>;
}) {
  const live = announcement.status === "LIVE";
  async function run() {
    try {
      if (live) {
        await onRetire();
        toast.success("Announcement retired.");
      } else {
        await onPublish();
        toast.success("Announcement published.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  }
  return (
    <Button size="sm" variant="ghost" onClick={run}>
      <IconPower className="size-4" />
    </Button>
  );
}