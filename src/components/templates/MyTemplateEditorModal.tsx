"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Globe2, Save, Send, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TemplateDesignPreview } from "@/components/templates/TemplateDesignPreview";
import {
  useDeleteMyTemplate,
  useSubmitMyTemplate,
  useUpdateMyTemplate,
  type Template,
  type TemplateCustomization,
  type TemplateDocumentType,
} from "@/lib/hooks/useTemplates";

const FONTS: NonNullable<TemplateCustomization["fontFamily"]>[] = [
  "Inter", "Source Sans 3", "IBM Plex Sans", "Georgia", "Arial", "Merriweather",
];

export function MyTemplateEditorModal({ template, onClose, onUse }: {
  template: Template;
  onClose: () => void;
  onUse: () => void;
}) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [documentType, setDocumentType] = useState<TemplateDocumentType>(template.documentType);
  const [accentColor, setAccentColor] = useState(template.customization?.accentColor ?? "#7357E8");
  const [fontFamily, setFontFamily] = useState<NonNullable<TemplateCustomization["fontFamily"]>>(template.customization?.fontFamily ?? "Inter");
  const [spacing, setSpacing] = useState<NonNullable<TemplateCustomization["spacing"]>>(template.customization?.spacing ?? "comfortable");
  const [headingStyle, setHeadingStyle] = useState<NonNullable<TemplateCustomization["headingStyle"]>>(template.customization?.headingStyle ?? "uppercase");
  const update = useUpdateMyTemplate();
  const submit = useSubmitMyTemplate();
  const remove = useDeleteMyTemplate();

  const liveTemplate = useMemo(() => {
    const density = spacing === "compact" ? ".76" : spacing === "airy" ? "1.24" : "1";
    const heading = headingStyle === "title" ? "text-transform:none;letter-spacing:.02em" : headingStyle === "minimal" ? "text-transform:none;letter-spacing:0;border-bottom-color:transparent" : "text-transform:uppercase";
    const scopedHtml = template.htmlLayout.includes("tpl-live-editor") ? template.htmlLayout : template.htmlLayout.replace('class="tpl ', 'class="tpl tpl-live-editor ');
    return {
      ...template,
      htmlLayout: scopedHtml,
      cssStyles: `${template.cssStyles}\n.tpl.tpl-live-editor{--accent:${accentColor};font-family:${fontFamily},system-ui,sans-serif;--live-density:${density}}\n.tpl.tpl-live-editor .tpl-section{margin-top:calc(1.25rem * var(--live-density))}\n.tpl.tpl-live-editor .tpl-section-title{${heading}}`,
    };
  }, [accentColor, fontFamily, headingStyle, spacing, template]);

  const save = async () => {
    try {
      await update.mutateAsync({
        id: template.id,
        name,
        description,
        documentType,
        customization: { accentColor, fontFamily, spacing, headingStyle },
      });
      toast.success("Your template changes are saved.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save template.");
    }
  };

  const publish = async () => {
    try {
      if (!description.trim()) {
        toast.error("Add a short description before publishing.");
        return;
      }
      await update.mutateAsync({
        id: template.id,
        name,
        description,
        documentType,
        customization: { accentColor, fontFamily, spacing, headingStyle },
      });
      await submit.mutateAsync(template.id);
      toast.success("Submitted for admin review. We will notify you when it is reviewed.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit template.");
    }
  };

  const destroy = async () => {
    if (!window.confirm("Remove this template from your gallery? Templates used by a résumé will be archived instead.")) return;
    try {
      const result = await remove.mutateAsync(template.id);
      toast.success(result.status === "archived" ? "Template archived." : "Template deleted.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove template.");
    }
  };

  const busy = update.isPending || submit.isPending || remove.isPending;
  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/65 p-2 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" aria-label={`Edit ${template.name}`}>
      <div className="glass-panel mx-auto grid h-full max-w-7xl overflow-hidden rounded-2xl border-white/20 bg-background/95 shadow-2xl lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-border/70 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-3 border-b border-border/70 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">My template studio</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Customize your edition</h2>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close editor"><X className="h-4 w-4" /></Button>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <StatusNote template={template} />
            <Field label="Template name"><Input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} /></Field>
            <Field label="Gallery description"><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/30" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Document type"><Select value={documentType} onChange={(value) => setDocumentType(value as TemplateDocumentType)} options={["RESUME", "CV"]} /></Field>
              <Field label="Accent"><div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-2"><input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value.toUpperCase())} className="h-7 w-9 cursor-pointer border-0 bg-transparent" /><Input value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="h-8 border-0 px-0 uppercase shadow-none focus-visible:ring-0" /></div></Field>
            </div>
            <Field label="Typography"><Select value={fontFamily} onChange={(value) => setFontFamily(value as typeof fontFamily)} options={FONTS} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Density"><Select value={spacing} onChange={(value) => setSpacing(value as typeof spacing)} options={["compact", "comfortable", "airy"]} /></Field>
              <Field label="Headings"><Select value={headingStyle} onChange={(value) => setHeadingStyle(value as typeof headingStyle)} options={["uppercase", "title", "minimal"]} /></Field>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/35 p-4 text-xs leading-relaxed text-muted-foreground">
              Publishing never exposes your résumé data. Only this design configuration is sent for admin review.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-border/70 p-4">
            <Button variant="outline" onClick={onUse}>Use in builder</Button>
            <Button onClick={save} disabled={busy || name.trim().length < 3}><Save className="mr-2 h-4 w-4" />Save changes</Button>
            <Button variant="secondary" className="col-span-2" onClick={publish} disabled={busy || template.reviewStatus === "PENDING"}><Send className="mr-2 h-4 w-4" />{template.reviewStatus === "PENDING" ? "Awaiting admin review" : "Submit to public gallery"}</Button>
            <Button variant="ghost" className="col-span-2 text-destructive hover:text-destructive" onClick={destroy} disabled={busy}><Trash2 className="mr-2 h-4 w-4" />Remove from my gallery</Button>
          </div>
        </aside>
        <main className="min-h-0 overflow-y-auto bg-gradient-to-br from-violet-100/70 via-slate-50 to-cyan-100/60 p-4 dark:from-violet-950/35 dark:via-slate-950 dark:to-cyan-950/30 sm:p-8">
          <div className="mx-auto max-w-[720px]">
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground"><span>Live original-template preview</span><span>{documentType === "CV" ? "Curriculum vitae" : "Résumé"} · A4</span></div>
            <TemplateDesignPreview template={liveTemplate} className="rounded-xl shadow-2xl shadow-slate-950/25" priority />
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>{label}</span>{children}</label>;
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: readonly string[] }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-violet-500/30">{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>;
}

function StatusNote({ template }: { template: Template }) {
  const config = template.reviewStatus === "APPROVED"
    ? { icon: CheckCircle2, label: "Published", tone: "text-emerald-700 bg-emerald-500/10 border-emerald-500/20" }
    : template.reviewStatus === "PENDING"
      ? { icon: Clock3, label: "Awaiting admin review", tone: "text-amber-700 bg-amber-500/10 border-amber-500/20" }
      : template.reviewStatus === "REJECTED"
        ? { icon: X, label: "Changes requested", tone: "text-rose-700 bg-rose-500/10 border-rose-500/20" }
        : { icon: Globe2, label: "Private draft", tone: "text-violet-700 bg-violet-500/10 border-violet-500/20" };
  const Icon = config.icon;
  return <div className={`rounded-xl border p-3 text-xs ${config.tone}`}><p className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4" />{config.label}</p>{template.rejectionReason ? <p className="mt-1.5 leading-relaxed">{template.rejectionReason}</p> : null}</div>;
}
