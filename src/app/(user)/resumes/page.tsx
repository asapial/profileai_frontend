'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, Search, Download, Trash2, Copy, TrendingUp, Filter } from 'lucide-react';
import { useResumes, useDeleteResume, useExportPdf } from '@/hooks/useResume';
import { formatRelativeTime, getAtsScoreColor, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Resume } from '@/types';

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'GENERATED', 'EXPORTED'];
const TYPE_OPTIONS = ['ALL', 'RESUME', 'CV'];

function ResumeCard({ resume, onDelete, onExport }: {
  resume: Resume;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
}) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{resume.title}</h3>
          <p className="text-xs text-zinc-500 mt-1">
            {resume.type} · {resume.template?.name || 'Custom'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn('badge', {
            'badge-success': resume.status === 'EXPORTED',
            'badge-primary': resume.status === 'GENERATED',
            'badge-warning': resume.status === 'DRAFT',
          })}>
            {resume.status}
          </span>
        </div>
      </div>

      {/* Target Job */}
      {resume.targetJobTitle && (
        <p className="text-sm text-zinc-400">
          <span className="text-zinc-600">Targeting:</span> {resume.targetJobTitle}
        </p>
      )}

      {/* ATS Score */}
      {resume.atsScore != null && (
        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <TrendingUp size={14} className="text-zinc-500" />
          <span className="text-xs text-zinc-400">ATS Score</span>
          <span className={cn('text-sm font-bold ml-auto', getAtsScoreColor(resume.atsScore))}>
            {resume.atsScore}%
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <span className="text-xs text-zinc-600">{formatRelativeTime(resume.updatedAt)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onExport(resume.id)}
            className="btn-ghost p-2 rounded-lg"
            title="Export PDF"
          >
            <Download size={15} />
          </button>
          <button
            onClick={() => onDelete(resume.id)}
            className="btn-ghost p-2 rounded-lg hover:text-red-400"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
          <Link href={`/resume/${resume.id}/edit`} className="btn-secondary py-1.5 px-3 text-xs ml-1">
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResumesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const { resumes, loading, meta, refetch } = useResumes({
    page,
    limit: 12,
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
  });

  const { deleteResume } = useDeleteResume();
  const { exportPdf, loading: exporting } = useExportPdf();

  const filtered = search
    ? resumes.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))
    : resumes;

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resume? This cannot be undone.')) return;
    const ok = await deleteResume(id);
    if (ok) { toast.success('Resume deleted.'); refetch(); }
  };

  const handleExport = async (id: string) => {
    toast.loading('Generating PDF...', { id: 'pdf' });
    const url = await exportPdf(id);
    if (url) {
      toast.success('PDF ready!', { id: 'pdf' });
      window.open(url, '_blank');
    } else {
      toast.error('Export failed', { id: 'pdf' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Resumes</h1>
          <p className="text-zinc-400 mt-1">{meta.total} resume{meta.total !== 1 ? 's' : ''} in total</p>
        </div>
        <Link href="/resume/create" className="btn-primary">
          <Plus size={18} /> New Resume
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search resumes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={15} className="text-zinc-500" />
          {TYPE_OPTIONS.map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                typeFilter === t ? 'badge-primary' : 'text-zinc-400 hover:text-white bg-white/5'
              )}>
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                statusFilter === s ? 'badge-primary' : 'text-zinc-400 hover:text-white bg-white/5'
              )}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <FileText size={48} className="mx-auto mb-4 text-zinc-700" />
          <p className="text-xl font-semibold text-white mb-2">No resumes found</p>
          <p className="text-zinc-400 mb-6">
            {search ? 'Try a different search term' : 'Create your first AI-powered resume'}
          </p>
          <Link href="/resume/create" className="btn-primary">
            <Plus size={18} /> Create Resume
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} onDelete={handleDelete} onExport={handleExport} />
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-sm">
                ← Prev
              </button>
              <span className="text-sm text-zinc-400">Page {page} of {meta.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="btn-secondary px-4 py-2 text-sm">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
