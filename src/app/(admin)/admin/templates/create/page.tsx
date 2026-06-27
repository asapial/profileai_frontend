'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { useCreateTemplate } from '@/hooks/useTemplate';

export default function CreateTemplatePage() {
  const router = useRouter();
  const { createTemplate, loading, error } = useCreateTemplate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'MODERN',
    htmlLayout: '<main><h1>{{firstName}} {{lastName}}</h1><p>{{summary}}</p></main>',
    cssStyles: 'body{font-family:Arial,sans-serif;color:#111} main{padding:32px}',
    isActive: 'true',
    isDefault: 'false',
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.htmlLayout || !form.cssStyles) {
      toast.error('Name, HTML, and CSS are required.');
      return;
    }
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    const template = await createTemplate(body);
    if (template) {
      toast.success('Template created.');
      router.push('/admin/templates');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Create Template</h1>
        <p className="text-zinc-400">Handlebars HTML and CSS for PDF rendering.</p>
      </div>
      <div className="card p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label><span className="input-label">Name</span><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label><span className="input-label">Category</span><select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>MODERN</option><option>CLASSIC</option><option>CREATIVE</option><option>ATS</option></select></label>
        </div>
        <label><span className="input-label">Description</span><input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label><span className="input-label">HTML layout</span><textarea className="input-field min-h-72 font-mono text-xs" value={form.htmlLayout} onChange={(e) => setForm({ ...form, htmlLayout: e.target.value })} /></label>
        <label><span className="input-label">CSS styles</span><textarea className="input-field min-h-60 font-mono text-xs" value={form.cssStyles} onChange={(e) => setForm({ ...form, cssStyles: e.target.value })} /></label>
        {error && <p className="input-error">{error}</p>}
        <button className="btn-primary" disabled={loading}><Save size={16} /> {loading ? 'Creating...' : 'Create template'}</button>
      </div>
    </form>
  );
}
