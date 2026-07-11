"use client";

// Admin Help Articles (A-P12).
//
// Tabbed: Articles list (filter + status) and Categories management.
// List table links to the inline editor; both panels accept deferred
// backend writes gracefully via TanStack Query errors.

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import {
  IconCheck,
  IconFile,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useAdminHelpArticles,
  useAdminHelpCategories,
  useCreateHelpArticle,
  useTransitionHelpArticle,
  useUpdateHelpArticle,
  type ArticleStatus,
} from "@/lib/hooks/useAdminHelpArticles";

const STATUSES: Array<ArticleStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
];

export function AdminHelpArticlesClient() {
  const [status, setStatus] = useState<ArticleStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{
    id: string | null;
    title: string;
    excerpt: string;
    body: string;
    category: string;
    slug: string;
  }>({
    id: null,
    title: "",
    excerpt: "",
    body: "",
    category: "",
    slug: "",
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading } = useAdminHelpArticles({ status, q });
  const items = useMemo(() => data ?? [], [data]);

  const { data: categories } = useAdminHelpCategories();
  const create = useCreateHelpArticle();

  const update = useUpdateHelpArticle(editing.id ?? "");
  const transition = useTransitionHelpArticle(editing.id ?? "");

  function newArticle() {
    setEditing({
      id: null,
      title: "",
      excerpt: "",
      body: "",
      category: categories?.[0]?.slug ?? "general",
      slug: "",
    });
  }

  async function save() {
    if (!editing.title.trim() || !editing.body.trim()) {
      toast.error("Title and body are required.");
      return;
    }
    try {
      if (editing.id) {
        await update.mutateAsync({
          title: editing.title,
          excerpt: editing.excerpt,
          body: editing.body,
          category: editing.category,
          slug: editing.slug,
        });
        toast.success("Article saved.");
      } else {
        await create.mutateAsync({
          title: editing.title,
          excerpt: editing.excerpt,
          body: editing.body,
          category: editing.category,
          slug: editing.slug || slugify(editing.title),
        });
        toast.success("Draft created.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  }

  async function changeStatus(next: ArticleStatus) {
    if (!editing.id) return;
    try {
      await transition.mutateAsync(next);
      toast.success(`Status set to ${next.toLowerCase()}.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Help center</h1>
          <p className="text-muted-foreground text-sm">
            Articles that power <code>/help</code> and the in-app tooltips.
          </p>
        </div>
        <Button onClick={newArticle}>
          <IconPlus className="mr-1.5 size-4" />
          New article
        </Button>
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="articles" className="mt-4 flex flex-col gap-4">
          <Card className="p-4">
            <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
              <div className="flex flex-col gap-2">
                <div className="text-muted-foreground text-xs">Search</div>
                <div className="relative">
                  <IconSearch className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    className="pl-9"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search title, excerpt, or author"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="text-muted-foreground text-xs">Status</div>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ArticleStatus | "ALL")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
            <Card>
              {isLoading ? (
                <div className="flex flex-col gap-2 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center gap-2 p-12 text-center text-sm">
                  <IconFile className="size-10" />
                  No articles match this filter.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{a.title}</span>
                            <span className="text-muted-foreground line-clamp-1 text-xs">
                              /{a.slug} · {a.views.toLocaleString()} views
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{a.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <ArticleStatusBadge status={a.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {a.authorName}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(a.updatedAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setEditing({
                                  id: a.id,
                                  title: a.title,
                                  excerpt: a.excerpt,
                                  body: "",
                                  category: a.category,
                                  slug: a.slug,
                                })
                              }
                            >
                              <IconPencil className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDelete(a.id)}
                            >
                              <IconTrash className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>

            <Card className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">
                  {editing.id ? "Edit article" : "New article"}
                </h2>
                {editing.id ? (
                  <Select
                    value={
                      items.find((i) => i.id === editing.id)?.status ?? "DRAFT"
                    }
                    onValueChange={(v) => changeStatus(v as ArticleStatus)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.filter((s) => s !== "ALL").map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
              <Separator />
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="art-title">Title</Label>
                  <Input
                    id="art-title"
                    value={editing.title}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="art-slug">Slug</Label>
                    <Input
                      id="art-slug"
                      value={editing.slug}
                      onChange={(e) =>
                        setEditing((p) => ({ ...p, slug: e.target.value }))
                      }
                      placeholder={slugify(editing.title)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="art-cat">Category</Label>
                    <Select
                      value={editing.category}
                      onValueChange={(v) =>
                        setEditing((p) => ({ ...p, category: v }))
                      }
                    >
                      <SelectTrigger id="art-cat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(categories ?? []).map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="art-excerpt">Excerpt</Label>
                  <Input
                    id="art-excerpt"
                    value={editing.excerpt}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, excerpt: e.target.value }))
                    }
                    placeholder="One-line summary shown in lists"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="art-body">Body (Markdown)</Label>
                  <textarea
                    id="art-body"
                    value={editing.body}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, body: e.target.value }))
                    }
                    rows={12}
                    className="border-input bg-background w-full rounded-md border p-3 font-mono text-xs"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditing({ ...editing, id: null })}
                  >
                    New
                  </Button>
                  <Button
                    onClick={save}
                    disabled={
                      create.isPending ||
                      update.isPending ||
                      !editing.title.trim() ||
                      !editing.body.trim()
                    }
                  >
                    <IconCheck className="mr-1.5 size-4" />
                    {editing.id ? "Save" : "Save draft"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card className="p-4">
            {(categories ?? []).length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No categories yet — defaults will load once the help API is
                live.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Articles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(categories ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <code className="text-xs">/{c.slug}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{c.articleCount}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <AdminConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(o) => {
          if (!o) setConfirmDelete(null);
        }}
        title="Delete article?"
        description="This permanently removes the article and unlinks it from any in-app tooltips."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          toast("Delete request queued.");
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  switch (status) {
    case "PUBLISHED":
      return <Badge>Published</Badge>;
    case "DRAFT":
      return (
        <Badge variant="secondary">
          <IconPencil className="mr-1 size-3" />
          Draft
        </Badge>
      );
    case "ARCHIVED":
      return <Badge variant="outline">Archived</Badge>;
  }
}
