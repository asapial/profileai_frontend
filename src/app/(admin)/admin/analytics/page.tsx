'use client';

import { useMemo } from 'react';
import { useAdminAnalytics } from '@/hooks/useAdmin';

export default function AdminAnalyticsPage() {
  const from = useMemo(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), []);
  const to = useMemo(() => new Date(), []);
  const { analytics, loading } = useAdminAnalytics(from, to);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-zinc-400">Last 30 days of platform activity.</p>
      </div>
      {loading ? <div className="skeleton h-96" /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries(analytics ?? {}).map(([key, value]) => (
            <section key={key} className="card p-5">
              <h2 className="mb-3 font-semibold capitalize text-white">{key.replace(/([A-Z])/g, ' $1')}</h2>
              <pre className="max-h-80 overflow-auto rounded-xl bg-black/30 p-4 text-xs text-zinc-300">{JSON.stringify(value, null, 2)}</pre>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
