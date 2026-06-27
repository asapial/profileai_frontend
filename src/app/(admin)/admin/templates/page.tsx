'use client';

import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { useDeleteTemplate, useTemplates } from '@/hooks/useTemplate';

export default function AdminTemplatesPage() {
  const { templates, loading, refetch } = useTemplates();
  const { deleteTemplate } = useDeleteTemplate();

  const remove = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const ok = await deleteTemplate(id);
    if (ok) {
      toast.success('Template deleted.');
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="text-zinc-400">Create and maintain resume templates.</p>
        </div>
        <Link href="/admin/templates/create" className="btn-primary"><Plus size={18} /> New</Link>
      </div>
      <div className="card overflow-hidden">
        {loading ? <div className="skeleton h-80" /> : templates.map((template) => (
          <div key={template.id} className="grid gap-4 border-b border-white/10 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="font-semibold text-white">{template.name}</p>
              <p className="text-sm text-zinc-500">{template.category} · {template.isActive ? 'Active' : 'Inactive'}</p>
            </div>
            <button className="btn-danger py-2" onClick={() => remove(template.id)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
