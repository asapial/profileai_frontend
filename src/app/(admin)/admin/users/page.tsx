'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Ban, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useAdminUsers } from '@/hooks/useAdmin';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { users, loading, toggleStatus, deleteUser } = useAdminUsers(1, 50, search, status || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-zinc-400">Search, ban, activate, or remove user accounts.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-72 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input className="input-field pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" />
        </div>
        <select className="input-field max-w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </div>
      <div className="card overflow-hidden">
        {loading ? <div className="skeleton h-80" /> : users.map((user) => (
          <div key={user.id} className="grid gap-4 border-b border-white/10 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="font-semibold text-white">{user.name}</p>
              <p className="text-sm text-zinc-500">{user.email}</p>
              <p className="mt-1 text-xs text-zinc-500">Resumes: {user.profile?.resumeCount ?? 0} · API: {user.profile?.apiCallCount ?? 0}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary py-2" onClick={async () => { await toggleStatus(user.id, !user.isActive); toast.success(user.isActive ? 'User banned.' : 'User activated.'); }}>
                {user.isActive ? <Ban size={16} /> : <ShieldCheck size={16} />} {user.isActive ? 'Ban' : 'Activate'}
              </button>
              <button className="btn-danger py-2" onClick={async () => { if (confirm('Delete this user permanently?')) { await deleteUser(user.id); toast.success('User deleted.'); } }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
