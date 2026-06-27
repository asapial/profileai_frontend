'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { useGenerateResume } from '@/hooks/useResume';
import { useTemplates } from '@/hooks/useTemplate';
import { generateResumeSchema } from '@/validations';

function CreateResumeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get('type') === 'CV' ? 'CV' : 'RESUME';
  const defaultTemplateId = searchParams.get('templateId') ?? '';
  const { templates } = useTemplates();
  const { generateResume, loading, error, progress } = useGenerateResume();
  const [form, setForm] = useState({
    templateId: defaultTemplateId,
    title: '',
    type: defaultType,
    targetJobTitle: '',
    jobDescription: '',
  });

  const selectedTemplate = useMemo(() => templates.find((template) => template.id === form.templateId), [templates, form.templateId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validated = generateResumeSchema.safeParse(form);
    if (!validated.success) {
      toast.error(validated.error.issues[0]?.message ?? 'Please complete the required fields.');
      return;
    }
    const resume = await generateResume(validated.data);
    if (resume) {
      toast.success('Resume generated.');
      router.push(`/resume/${resume.id}/edit`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Create Resume</h1>
          <p className="text-zinc-400">Tell the AI what role this resume should win.</p>
        </div>
        <div className="card p-6 space-y-5">
          <label><span className="input-label">Title</span><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Senior Frontend Resume" /></label>
          <label><span className="input-label">Type</span><select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'RESUME' | 'CV' })}><option>RESUME</option><option>CV</option></select></label>
          <label><span className="input-label">Target job title</span><input className="input-field" value={form.targetJobTitle} onChange={(e) => setForm({ ...form, targetJobTitle: e.target.value })} placeholder="Product Engineer" /></label>
          <label><span className="input-label">Job description</span><textarea className="input-field min-h-48" value={form.jobDescription} onChange={(e) => setForm({ ...form, jobDescription: e.target.value })} placeholder="Paste the role description for better ATS targeting." /></label>
          {error && <p className="input-error">{error}</p>}
          <button className="btn-primary" disabled={loading}>{loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} {loading ? progress || 'Generating...' : 'Generate with AI'}</button>
        </div>
      </div>
      <aside className="card p-5 space-y-4 self-start">
        <h2 className="font-semibold text-white">Template</h2>
        <select className="input-field" value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })}>
          <option value="">Select a template</option>
          {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
        </select>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="font-medium text-white">{selectedTemplate?.name ?? 'No template selected'}</p>
          <p className="mt-1 text-sm text-zinc-500">{selectedTemplate?.description ?? 'Choose one from the template library.'}</p>
        </div>
      </aside>
    </form>
  );
}

export default function CreateResumePage() {
  return <Suspense fallback={<div className="skeleton h-96 w-full" />}><CreateResumeForm /></Suspense>;
}
