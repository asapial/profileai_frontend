import { useState, useEffect, useCallback } from 'react';
import { apiClient, getErrorMessage } from '@/lib/api-client';
import type { ResumeTemplate } from '@/types';

export function useTemplates(category?: string) {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = category && category !== 'ALL' ? `?category=${category}` : '';
      const res = await apiClient.get<{ data: ResumeTemplate[] }>(`/templates${params}`);
      setTemplates(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  return { templates, loading, error, refetch: fetchTemplates };
}

export function useTemplate(id: string) {
  const [template, setTemplate] = useState<ResumeTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiClient.get<{ data: { template: ResumeTemplate } }>(`/templates/${id}`)
      .then((res) => setTemplate(res.data.data.template))
      .finally(() => setLoading(false));
  }, [id]);

  return { template, loading };
}

export function useCreateTemplate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTemplate = async (formData: FormData): Promise<ResumeTemplate | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{ data: ResumeTemplate }>('/templates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createTemplate, loading, error };
}

export function useUpdateTemplate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTemplate = async (id: string, formData: FormData): Promise<ResumeTemplate | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.put<{ data: ResumeTemplate }>(`/templates/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateTemplate, loading, error };
}

export function useDeleteTemplate() {
  const [loading, setLoading] = useState(false);

  const deleteTemplate = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      await apiClient.delete(`/templates/${id}`);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteTemplate, loading };
}
