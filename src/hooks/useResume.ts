import { useState, useEffect, useCallback } from 'react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import type { Resume, ResumeHistory, AiSuggestions } from '@/types';

// ─── List Resumes ─────────────────────────────────────

interface ListResumesOptions {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

export function useResumes(options: ListResumesOptions = {}) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (options.page) params.set('page', String(options.page));
      if (options.limit) params.set('limit', String(options.limit));
      if (options.type) params.set('type', options.type);
      if (options.status) params.set('status', options.status);

      const res = await apiClient.get<{ data: Resume[]; meta: typeof meta }>(
        `/resumes?${params.toString()}`
      );
      setResumes(res.data.data);
      if (res.data.meta) setMeta(res.data.meta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [options.page, options.limit, options.type, options.status]);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  return { resumes, loading, error, meta, refetch: fetchResumes };
}

// ─── Get Single Resume ────────────────────────────────

export function useResume(id: string) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResume = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: Resume }>(`/resumes/${id}`);
      setResume(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchResume(); }, [fetchResume]);

  return { resume, loading, error, refetch: fetchResume, setResume };
}

// ─── Generate Resume ──────────────────────────────────

interface GenerateResumeData {
  templateId: string;
  title: string;
  type: 'RESUME' | 'CV';
  targetJobTitle: string;
  jobDescription?: string;
}

export function useGenerateResume() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [progress, setProgress] = useState<string>('');

  const generateResume = async (data: GenerateResumeData): Promise<Resume | null> => {
    setLoading(true);
    setError(null);
    setErrorCode(undefined);

    const steps = ['Analyzing profile...', 'Structuring content...', 'Writing AI content...', 'Finalizing...'];
    let stepIndex = 0;
    setProgress(steps[0]);

    const progressInterval = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setProgress(steps[stepIndex]);
    }, 4000);

    try {
      const res = await apiClient.post<{ data: { resume: Resume } }>('/resumes/generate', data);
      setProgress('Done!');
      return res.data.data.resume;
    } catch (err) {
      setError(getErrorMessage(err));
      setErrorCode(
        (err as any)?.response?.data?.code
      );
      return null;
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setProgress('');
    }
  };

  return { generateResume, loading, error, errorCode, progress };
}

// ─── Update Resume ────────────────────────────────────

export function useUpdateResume() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);

  const updateResume = async (id: string, data: Partial<Resume>): Promise<Resume | null> => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await apiClient.put<{ data: Resume }>(`/resumes/${id}`, data);
      setSaved(true);
      return res.data.data;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateResume, loading, error, saved };
}

// ─── Delete Resume ────────────────────────────────────

export function useDeleteResume() {
  const [loading, setLoading] = useState(false);

  const deleteResume = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await apiClient.delete(`/resumes/${id}`);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteResume, loading };
}

// ─── ATS Check ───────────────────────────────────────

export function useAtsCheck() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAtsCheck = async (resumeId: string, jobDescription: string): Promise<AiSuggestions | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{ data: { atsData: AiSuggestions } }>(
        `/resumes/${resumeId}/ats-check`,
        { jobDescription }
      );
      return res.data.data.atsData;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { runAtsCheck, loading, error };
}

// ─── Export PDF ───────────────────────────────────────

export function useExportPdf() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = async (resumeId: string, format: 'A4' | 'Letter' = 'A4'): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{ data: { presignedUrl: string } }>(
        `/resumes/${resumeId}/export`,
        { format }
      );
      return res.data.data.presignedUrl;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { exportPdf, loading, error };
}

// ─── Resume History ────────────────────────────────────

export function useResumeHistory(resumeId: string) {
  const [history, setHistory] = useState<ResumeHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resumeId) return;
    apiClient.get<{ data: ResumeHistory[] }>(`/resumes/${resumeId}/history`)
      .then((res) => setHistory(res.data.data))
      .finally(() => setLoading(false));
  }, [resumeId]);

  return { history, loading };
}

// ─── AI Modify Section ────────────────────────────────

export function useAiModify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modifySection = async (
    resumeId: string,
    section: string,
    instruction: string
  ): Promise<Resume | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.put<{ data: Resume }>(
        `/resumes/${resumeId}/ai-modify`,
        { section, instruction }
      );
      return res.data.data;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { modifySection, loading, error };
}
