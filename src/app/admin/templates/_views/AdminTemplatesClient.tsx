"use client";

// Admin template management (A-P5).
//
// Filterable list with status / default / edit / delete row actions.
// Delete is disabled (not just warned) for templates that are in
// active use. Default toggling is transactional on the backend; the
// UI shows the previous default as a toast for accountability.

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconFileDescription,
  IconPencil,
  IconPlus,
  IconStar,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import {
  useAdminTemplates,
  useDeleteTemplate,
  useSetDefaultTemplate,
  useToggleTemplateStatus,
  useReviewTemplate,
  type AdminTemplateFilters,
  type Template,
  type TemplateCategory,
} from "@/lib/hooks/useAdminTemplates";

const CATEGORIES: Array<TemplateCategory | "ALL"> = [
  "ALL",
  "MODERN",
  "CLASSIC",
  "CREATIVE",
  "ATS",
];

export function AdminTemplatesClient() {
  const [category, setCategory] = useState<AdminTemplateFilters["category"]>(
    "ALL",
  );
  const [status, setStatus] = useState<AdminTemplateFilters["status"]>("all");
  const [documentType, setDocumentType] = useState<AdminTemplateFilters["documentType"]>("ALL");
  const [reviewStatus, setReviewStatus] = useState<AdminTemplateFilters["reviewStatus"]>("ALL");
  const rejectionReasonRef = useRef<HTMLTextAreaElement>(null);

  const filters = useMemo(
    () => ({ category, status, documentType, reviewStatus }),
    [category, documentType, reviewStatus, status],
  );

  const query = useAdminTemplates(filters);
  const toggleStatus = useToggleTemplateStatus();
  const setDefault = useSetDefaultTemplate();
  const remove = useDeleteTemplate();
  const review = useReviewTemplate();

  const [confirm, setConfirm] = useState<
    | {
        title: string;
        description: React.ReactNode;
        confirmLabel: string;
        destructive?: boolean;
        run: () => Promise<void>;
        children?: React.ReactNode;
      }
    | null
  >(null);

  const templates = query.data ?? [];

  const onToggle = async (t: Template) => {
    try {
      await toggleStatus.mutateAsync({ id: t.id, isActive: !t.isActive });
      toast.success(
        t.isActive ? "Template deactivated." : "Template activated.",
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  };

  const onSetDefault = async (t: Template) => {
    try {
      const result = await setDefault.mutateAsync(t.id);
      toast.success(
        result.previousDefaultId
          ? `Default updated from ${result.previousDefaultId} to ${t.name}.`
          : `${t.name} is now the default.`,
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  };

  const onDelete = (t: Template) => {
    setConfirm({
      title: "Delete template?",
      description: (
        <>
          This removes the template permanently. Resumes already using it
          keep rendering from their snapshot. To hide it from the gallery
          without removing, deactivate instead.
          <br />
          <span className="text-muted-foreground text-xs">{t.name}</span>
        </>
      ),
      confirmLabel: "Delete template",
      destructive: true,
      run: async () => {
        try {
          await remove.mutateAsync(t.id);
          toast.success("Template deleted.");
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : "Failed.");
          throw err;
        }
      },
    });
  };

  const onApprove = async (t: Template) => {
    try {
      await review.mutateAsync({ id: t.id, decision: "APPROVED" });
      toast.success(`${t.name} is now published in the public gallery.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Review failed.");
    }
  };

  const onReject = (t: Template) => {
    setConfirm({
      title: `Request changes for ${t.name}`,
      description: "Explain what the creator should improve. This note is delivered through their real-time notifications and shown in their private gallery.",
      confirmLabel: "Send change request",
      destructive: true,
      children: (
        <textarea
          ref={rejectionReasonRef}
          rows={5}
          placeholder="Describe the required changes…"
          className="mt-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
        />
      ),
      run: async () => {
        const reason = rejectionReasonRef.current?.value.trim() || "Please refine the template design and description, then resubmit it for review.";
        await review.mutateAsync({ id: t.id, decision: "REJECTED", reason });
        toast.success("Change request sent to the creator.");
      },
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Template gallery
          </h1>
          <p className="text-muted-foreground text-sm">
            Curate the public resume template library. Deactivate to hide
            without breaking existing resumes; delete only when no resume
            references this template.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/templates/create">
            <IconPlus className="size-4" />
            New template
          </Link>
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Select
            value={category ?? "ALL"}
            onValueChange={(v) =>
              setCategory(v as AdminTemplateFilters["category"])
            }
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "ALL" ? "All categories" : c.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={documentType ?? "ALL"} onValueChange={(value) => setDocumentType(value as AdminTemplateFilters["documentType"])}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Document" /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">All documents</SelectItem><SelectItem value="RESUME">Résumés</SelectItem><SelectItem value="CV">CVs</SelectItem></SelectContent>
          </Select>
          <Select value={reviewStatus ?? "ALL"} onValueChange={(value) => setReviewStatus(value as AdminTemplateFilters["reviewStatus"])}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Review" /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">All review states</SelectItem><SelectItem value="PENDING">Pending approval</SelectItem><SelectItem value="APPROVED">Approved</SelectItem><SelectItem value="DRAFT">Private drafts</SelectItem><SelectItem value="REJECTED">Changes requested</SelectItem></SelectContent>
          </Select>
          <Select
            value={status ?? "all"}
            onValueChange={(v) =>
              setStatus(v as AdminTemplateFilters["status"])
            }
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Default</TableHead>
              <TableHead className="w-10 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && !query.data
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-12 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : null}

            {!query.isLoading && templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-2 text-sm">
                    <IconFileDescription className="size-6" />
                    No templates match these filters.
                  </div>
                </TableCell>
              </TableRow>
            ) : null}

            {templates.map((t) => {
              const inUse = t._count.resumes > 0;
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-8 items-center justify-center rounded bg-muted text-xs">
                        {t.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.thumbnailUrl}
                            alt=""
                            className="h-full w-full rounded object-cover"
                          />
                        ) : (
                          <IconFileDescription className="text-muted-foreground size-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{t.name}</span>
                        {t.description ? (
                          <span className="text-muted-foreground line-clamp-1 text-xs">
                            {t.description}
                          </span>
                        ) : null}
                        {t.owner ? <span className="text-[11px] text-violet-600">Submitted by {t.owner.name}{t.owner.email ? ` · ${t.owner.email}` : ""}</span> : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.category.toLowerCase()}
                  </TableCell>
                  <TableCell className="text-sm">{t.documentType === "CV" ? "CV" : "Résumé"}</TableCell>
                  <TableCell><Badge variant={t.reviewStatus === "PENDING" ? "default" : t.reviewStatus === "REJECTED" ? "destructive" : "secondary"}>{t.reviewStatus.toLowerCase()}</Badge></TableCell>
                  <TableCell>
                    <Badge
                      variant={t.isActive ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => onToggle(t)}
                    >
                      {t.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {t._count.resumes}
                  </TableCell>
                  <TableCell>
                    {t.isDefault ? (
                      <Badge variant="default" className="gap-1">
                        <IconStar className="size-3" /> Default
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSetDefault(t)}
                        disabled={setDefault.isPending}
                        className="gap-1"
                      >
                        <IconStar className="size-4" />
                        Set default
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {t.reviewStatus === "PENDING" ? <>
                        <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700" onClick={() => onApprove(t)} disabled={review.isPending} aria-label={`Approve ${t.name}`}><IconCheck className="size-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => onReject(t)} disabled={review.isPending} aria-label={`Request changes for ${t.name}`}><IconX className="size-4" /></Button>
                      </> : null}
                      <Button asChild size="sm" variant="ghost">
                        <Link
                          href={`/admin/templates/${t.id}/edit`}
                          aria-label={`Edit ${t.name}`}
                        >
                          <IconPencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Duplicate ${t.name}`}
                        onClick={() =>
                          toast(
                            "Duplicate is a future workflow — use Edit then Save As.",
                          )
                        }
                      >
                        <IconCopy className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Delete ${t.name}`}
                        disabled={inUse}
                        title={
                          inUse
                            ? "Template is in use — deactivate instead."
                            : "Delete template"
                        }
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(t)}
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card className="flex items-center gap-3 p-4 text-sm">
        <IconEdit className="text-muted-foreground size-4" />
        <span className="text-muted-foreground text-xs">
          Editing a live template writes a version history snapshot and
          applies to future renders. Existing resumes continue rendering
          from the live configuration.
        </span>
      </Card>

      <AdminConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(o) => {
          if (!o) setConfirm(null);
        }}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? null}
        confirmLabel={confirm?.confirmLabel ?? "Confirm"}
        destructive={confirm?.destructive}
        busy={remove.isPending}
        onConfirm={async () => {
          if (confirm) await confirm.run();
        }}
      >{confirm?.children}</AdminConfirmDialog>
    </div>
  );
}

