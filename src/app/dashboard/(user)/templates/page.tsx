"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, CheckCircle2, CopyPlus, FileText, LayoutGrid, Pencil, Search, Send, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TemplateGalleryCard } from "@/components/templates/TemplateGalleryCard";
import { TemplatePreviewModal } from "@/components/templates/TemplatePreviewModal";
import { TemplateDesignPreview } from "@/components/templates/TemplateDesignPreview";
import { MyTemplateEditorModal } from "@/components/templates/MyTemplateEditorModal";
import {
  TEMPLATE_SORTS,
  sortTemplates,
  useForkTemplate,
  useMyTemplates,
  useTemplates,
  type Template,
  type TemplateCategory,
  type TemplateDocumentType,
  type TemplateSort,
} from "@/lib/hooks/useTemplates";

const CATEGORIES: { value: TemplateCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "All styles" },
  { value: "MODERN", label: "Modern" },
  { value: "CLASSIC", label: "Classic" },
  { value: "CREATIVE", label: "Creative" },
  { value: "ATS", label: "ATS-first" },
];

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"gallery" | "mine">(searchParams.get("view") === "mine" || searchParams.has("customize") ? "mine" : "gallery");
  const [documentType, setDocumentType] = useState<TemplateDocumentType>("RESUME");
  const [category, setCategory] = useState<TemplateCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TemplateSort>("featured");
  const [preview, setPreview] = useState<Template | null>(null);
  const [editing, setEditing] = useState<Template | null>(null);
  const handledCustomize = useRef(false);
  const publicQuery = useTemplates({ category, documentType });
  const myQuery = useMyTemplates();
  const fork = useForkTemplate();

  const publicTemplates = useMemo(() => sortTemplates((publicQuery.data ?? []).filter((template) => matches(template, search)), sort), [publicQuery.data, search, sort]);
  const myTemplates = useMemo(() => (myQuery.data ?? []).filter((template) => template.documentType === documentType && (category === "ALL" || template.category === category) && matches(template, search)), [category, documentType, myQuery.data, search]);

  const saveEditableCopy = async (template: Template) => {
    try {
      const existing = myQuery.data?.find((item) => item.sourceTemplateId === template.id || item.id === template.id);
      const copy = existing ?? await fork.mutateAsync({ sourceTemplateId: template.id });
      setView("mine");
      setEditing(copy);
      toast.success(existing ? "Opening your saved edition." : "Editable copy saved to your gallery.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save an editable copy.");
    }
  };

  useEffect(() => {
    const requested = searchParams.get("customize");
    if (!requested || handledCustomize.current || !publicQuery.data || !myQuery.data) return;
    const source = publicQuery.data.find((template) => template.id === requested);
    if (!source) return;
    handledCustomize.current = true;
    const existing = myQuery.data.find((item) => item.sourceTemplateId === source.id || item.id === source.id);
    if (existing) {
      queueMicrotask(() => setEditing(existing));
    } else {
      fork.mutate(
        { sourceTemplateId: source.id },
        {
          onSuccess: (copy) => {
            setEditing(copy);
            toast.success("Editable copy saved to your gallery.");
          },
          onError: (error) => toast.error(error instanceof Error ? error.message : "Could not save an editable copy."),
        },
      );
    }
    router.replace("/dashboard/templates?view=mine", { scroll: false });
  }, [fork, myQuery.data, publicQuery.data, router, searchParams]);

  const openBuilder = (template: Template) => router.push(`/resume/create?templateId=${encodeURIComponent(template.id)}`);
  const items = view === "gallery" ? publicTemplates : myTemplates;
  const loading = view === "gallery" ? publicQuery.isLoading : myQuery.isLoading;
  const failed = view === "gallery" ? publicQuery.isError : myQuery.isError;

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 md:p-8">
      <section className="glass-panel relative overflow-hidden rounded-3xl border-white/55 p-6 shadow-xl shadow-violet-500/5 sm:p-8 dark:border-white/10">
        <div aria-hidden className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
        <div aria-hidden className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="premium-kicker w-fit"><Sparkles className="h-3.5 w-3.5" />Template studio</p>
            <h1 className="mt-4 text-3xl font-bold tracking-[-.035em] sm:text-4xl">Original templates, made uniquely yours.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">Choose from 30 résumé and 30 CV designs, edit visual details, save private editions, and submit your best work to the community gallery.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[390px]">
            <Stat value="30" label="résumés" icon={FileText} />
            <Stat value="30" label="CVs" icon={BookOpen} />
            <Stat value="Live" label="editable" icon={CheckCircle2} />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/50 p-3 backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          <Segment active={view === "gallery"} onClick={() => setView("gallery")} icon={LayoutGrid}>Public gallery</Segment>
          <Segment active={view === "mine"} onClick={() => setView("mine")} icon={Pencil}>My gallery <span className="ml-1 rounded-full bg-current/10 px-1.5 py-0.5 text-[10px]">{myQuery.data?.length ?? 0}</span></Segment>
        </div>
        <div className="flex w-fit rounded-xl border border-border/70 bg-muted/35 p-1">
          <Segment active={documentType === "RESUME"} onClick={() => setDocumentType("RESUME")} icon={FileText}>Résumés</Segment>
          <Segment active={documentType === "CV"} onClick={() => setDocumentType("CV")} icon={BookOpen}>CVs</Segment>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/45 p-4 backdrop-blur-xl lg:grid-cols-[minmax(220px,1fr)_auto_auto] lg:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, role, or style…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">{CATEGORIES.map((item) => <button key={item.value} type="button" onClick={() => setCategory(item.value)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${category === item.value ? "border-violet-500 bg-violet-600 text-white shadow-sm" : "border-border bg-background/60 text-muted-foreground hover:border-violet-300 hover:text-foreground"}`}>{item.label}</button>)}</div>
        {view === "gallery" ? <select value={sort} onChange={(event) => setSort(event.target.value as TemplateSort)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/30" aria-label="Sort templates">{TEMPLATE_SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select> : null}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{items.length} {documentType === "CV" ? "CV" : "résumé"} templates</span><span>{view === "mine" ? "Private by default · publish only when ready" : "Every card is a live template render"}</span></div>

      {loading ? <Empty text="Loading original templates…" /> : failed ? <Empty text="The template catalog could not be loaded." destructive /> : items.length === 0 ? <Empty text={view === "mine" ? "Your gallery is ready for its first template. Save an editable copy from the public gallery." : "No templates match these filters."} action={view === "mine" ? () => setView("gallery") : undefined} /> : view === "gallery" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((template) => <TemplateGalleryCard key={template.id} template={template} onPreview={() => setPreview(template)} onUse={() => openBuilder(template)} onCustomize={() => saveEditableCopy(template)} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((template) => <MyTemplateCard key={template.id} template={template} onEdit={() => setEditing(template)} onUse={() => openBuilder(template)} />)}
        </div>
      )}

      <TemplatePreviewModal template={preview} onClose={() => setPreview(null)} onUse={() => preview && openBuilder(preview)} onCustomize={() => preview && saveEditableCopy(preview)} />
      {editing ? <MyTemplateEditorModal template={editing} onClose={() => setEditing(null)} onUse={() => openBuilder(editing)} /> : null}
    </div>
  );
}

function matches(template: Template, search: string) {
  const term = search.trim().toLowerCase();
  return !term || template.name.toLowerCase().includes(term) || (template.description ?? "").toLowerCase().includes(term);
}

function Segment({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof LayoutGrid; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/20" : "text-muted-foreground hover:bg-violet-500/8 hover:text-foreground"}`}><Icon className="h-4 w-4" />{children}</button>;
}

function Stat({ value, label, icon: Icon }: { value: string; label: string; icon: typeof FileText }) {
  return <div className="rounded-xl border border-border/60 bg-background/50 p-3 text-center backdrop-blur-xl"><Icon className="mx-auto h-4 w-4 text-violet-500" /><p className="mt-2 font-bold">{value}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p></div>;
}

function MyTemplateCard({ template, onEdit, onUse }: { template: Template; onEdit: () => void; onUse: () => void }) {
  const tone = template.reviewStatus === "APPROVED" ? "bg-emerald-500/10 text-emerald-700" : template.reviewStatus === "PENDING" ? "bg-amber-500/10 text-amber-700" : template.reviewStatus === "REJECTED" ? "bg-rose-500/10 text-rose-700" : "bg-violet-500/10 text-violet-700";
  return <article className="glass-panel group overflow-hidden rounded-2xl border border-white/55 p-3 transition hover:-translate-y-1 hover:border-violet-400/60 hover:shadow-2xl hover:shadow-violet-500/10 dark:border-white/10">
    <div className="relative rounded-xl bg-gradient-to-br from-violet-100/70 via-white to-cyan-100/70 p-2 dark:from-violet-950/40 dark:via-slate-950 dark:to-cyan-950/40"><TemplateDesignPreview template={template} className="rounded-lg shadow-xl transition duration-500 group-hover:scale-[1.01]" /><Badge className={`absolute left-4 top-4 border-0 ${tone}`}>{template.reviewStatus.toLowerCase()}</Badge><Badge className="absolute right-4 top-4 border-0 bg-slate-950 text-white">{template.documentType}</Badge></div>
    <div className="p-2 pt-4"><h3 className="font-semibold">{template.name}</h3><p className="mt-1 line-clamp-2 min-h-10 text-xs leading-relaxed text-muted-foreground">{template.description || "Private editable template"}</p>{template.rejectionReason ? <p className="mt-3 rounded-lg bg-rose-500/8 p-2 text-xs text-rose-700">{template.rejectionReason}</p> : null}<div className="mt-4 grid grid-cols-2 gap-2"><Button size="sm" variant="outline" onClick={onEdit}><Pencil className="mr-1.5 h-3.5 w-3.5" />Edit</Button><Button size="sm" onClick={onUse}>Use</Button>{template.reviewStatus !== "PENDING" ? <Button size="sm" variant="secondary" className="col-span-2" onClick={onEdit}><Send className="mr-1.5 h-3.5 w-3.5" />Prepare publication</Button> : null}</div></div>
  </article>;
}

function Empty({ text, destructive = false, action }: { text: string; destructive?: boolean; action?: () => void }) {
  return <div className={`flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-background/35 p-8 text-center text-sm ${destructive ? "border-rose-300 text-rose-600" : "border-border text-muted-foreground"}`}><CopyPlus className="h-8 w-8 opacity-60" /><p className="max-w-md">{text}</p>{action ? <Button variant="secondary" onClick={action}>Browse public gallery</Button> : null}</div>;
}
