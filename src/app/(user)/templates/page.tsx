'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, LayoutTemplate, Plus } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplate';
import { cn } from '@/lib/utils';

const categories = ['ALL', 'MODERN', 'CLASSIC', 'CREATIVE', 'ATS'];

export default function TemplatesPage() {
  const [category, setCategory] = useState('ALL');
  const { templates, loading, error } = useTemplates(category);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="text-zinc-400">Pick a structure before generating your resume.</p>
        </div>
        <Link href="/resume/create" className="btn-primary"><Plus size={18} /> Create</Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={cn('px-4 py-2 rounded-xl text-sm font-medium', category === item ? 'badge-primary' : 'bg-white/5 text-zinc-400 hover:text-white')}>
            {item}
          </button>
        ))}
      </div>
      {error && <p className="input-error">{error}</p>}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-64" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <article key={template.id} className="card card-hover overflow-hidden">
              <div className="flex aspect-[4/3] items-center justify-center bg-white/5">
                {template.thumbnailUrl ? <img src={template.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <LayoutTemplate size={42} className="text-zinc-600" />}
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-white">{template.name}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{template.description || template.category}</p>
                  </div>
                  {template.isDefault && <span className="badge badge-success"><Check size={12} /> Default</span>}
                </div>
                <Link href={`/resume/create?templateId=${template.id}`} className="btn-secondary w-full py-2">Use template</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
