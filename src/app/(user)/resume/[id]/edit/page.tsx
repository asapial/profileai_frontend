'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Save, Sparkles, Target } from 'lucide-react';
import { useAtsCheck, useExportPdf, useResume, useUpdateResume } from '@/hooks/useResume';

export default function EditResumePage() {
  const params = useParams<{ id: string }>();
  const resumeId = params.id;
  const { resume, loading, setResume } = useResume(resumeId);
  const { updateResume, loading: saving } = useUpdateResume();
  const { runAtsCheck, loading: checking } = useAtsCheck();
  const { exportPdf, loading: exporting } = useExportPdf();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  useEffect(() => {
    if (!resume) return;
    setTitle(resume.title);
    setContent(JSON.stringify(resume.contentData, null, 2));
    setJobDescription(resume.jobDescription ?? '');
  }, [resume]);

  const save = async () => {
    try {
      const parsed = JSON.parse(content);
      const updated = await updateResume(resumeId, { title, contentData: parsed });
      if (updated) {
        setResume(updated);
        toast.success('Resume saved.');
      }
    } catch {
      toast.error('Resume content must be valid JSON.');
    }
  };

  const ats = async () => {
    const result = await runAtsCheck(resumeId, jobDescription);
    if (result) toast.success(`ATS score: ${result.atsScore}%`);
  };

  const pdf = async () => {
    const url = await exportPdf(resumeId);
    if (url) window.open(url, '_blank');
  };

  if (loading) return <div className="skeleton h-96 w-full" />;
  if (!resume) return <p className="text-zinc-400">Resume not found.</p>;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Resume Editor</h1>
            <p className="text-zinc-400">Version {resume.version} · {resume.status}</p>
          </div>
          <button onClick={save} disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Saving...' : 'Save'}</button>
        </div>
        <div className="card p-5 space-y-4">
          <label><span className="input-label">Title</span><input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label><span className="input-label">Resume content JSON</span><textarea className="input-field min-h-[560px] font-mono text-xs" value={content} onChange={(e) => setContent(e.target.value)} /></label>
        </div>
      </section>
      <aside className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-white">ATS Check</h2>
          <textarea className="input-field min-h-40" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste job description" />
          <button onClick={ats} disabled={checking || !jobDescription} className="btn-secondary w-full"><Target size={16} /> {checking ? 'Checking...' : 'Run ATS check'}</button>
          {resume.atsScore != null && <div className="rounded-xl bg-white/5 p-4 text-center"><p className="text-sm text-zinc-400">Current score</p><p className="text-4xl font-bold gradient-text">{resume.atsScore}%</p></div>}
        </div>
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-white">Export</h2>
          <button onClick={pdf} disabled={exporting} className="btn-primary w-full"><Download size={16} /> {exporting ? 'Exporting...' : 'Download PDF'}</button>
        </div>
      </aside>
    </div>
  );
}
