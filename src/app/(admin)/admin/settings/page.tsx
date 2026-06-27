'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdmin';

const defaults = [
  { key: 'DEFAULT_RESUME_LIMIT', value: '5' },
  { key: 'DEFAULT_API_LIMIT', value: '50' },
  { key: 'ENABLE_REGISTRATION', value: 'true' },
];

export default function AdminSettingsPage() {
  const { settings, loading, saving, saveSettings, error } = useAdminSettings();
  const [rows, setRows] = useState(defaults);

  useEffect(() => {
    if (settings.length) setRows(settings.map(({ key, value }) => ({ key, value })));
  }, [settings]);

  const save = async () => {
    const ok = await saveSettings(rows);
    if (ok) toast.success('Settings saved.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400">Manage platform configuration values.</p>
      </div>
      <div className="card p-6 space-y-4">
        {loading ? <div className="skeleton h-40" /> : rows.map((row, index) => (
          <div key={row.key} className="grid gap-3 md:grid-cols-[280px_1fr]">
            <input className="input-field" value={row.key} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, key: e.target.value } : item))} />
            <input className="input-field" value={row.value} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, value: e.target.value } : item))} />
          </div>
        ))}
        {error && <p className="input-error">{error}</p>}
        <button onClick={save} disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Saving...' : 'Save settings'}</button>
      </div>
    </div>
  );
}
