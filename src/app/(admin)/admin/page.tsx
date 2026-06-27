'use client';

import Link from 'next/link';
import { Activity, FileText, Settings, Users } from 'lucide-react';
import { useAdminDashboard } from '@/hooks/useAdmin';

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="card p-6">
      <Icon className="mb-4 text-purple-400" />
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { stats, loading } = useAdminDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-zinc-400">Operational overview for ProFile AI.</p>
      </div>
      {loading ? <div className="skeleton h-48" /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Stat label="Users" value={stats?.totalUsers ?? 0} icon={Users} />
          <Stat label="Active sessions" value={stats?.activeSessions ?? 0} icon={Activity} />
          <Stat label="Resumes today" value={stats?.todayResumes ?? 0} icon={FileText} />
          <Stat label="Monthly API calls" value={stats?.totalApiCallsThisMonth ?? 0} icon={Settings} />
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/admin/users" className="btn-secondary">Manage users</Link>
        <Link href="/admin/templates" className="btn-secondary">Manage templates</Link>
        <Link href="/admin/settings" className="btn-secondary">Platform settings</Link>
      </div>
    </div>
  );
}
