'use client';

import Link from 'next/link';
import { Plus, FileText, Layout, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useResumes } from '@/hooks/useResume';
import { useUserLimits } from '@/hooks/useProfile';
import { formatRelativeTime, getAtsScoreColor, getUsageColor, getInitials } from '@/lib/utils';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const barColor = getUsageColor(used, limit);
  const isWarning = pct >= 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span className={isWarning ? 'text-amber-400' : 'text-white'}>
          {used} / {limit}
        </span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { resumes, loading: resumesLoading } = useResumes({ limit: 5 });
  const { limits } = useUserLimits();

  const firstName = profile?.profile?.firstName || profile?.name?.split(' ')[0] || 'there';
  const completionPct = profile?.completionPercentage || 0;
  const avgAts = resumes.length
    ? Math.round(resumes.filter((r) => r.atsScore != null).reduce((a, r) => a + (r.atsScore || 0), 0) / resumes.filter((r) => r.atsScore != null).length)
    : 0;

  const isNearLimit =
    limits && (limits.resumeUsed / limits.resumeLimit >= 0.8 || limits.apiUsed / limits.apiLimit >= 0.8);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="gradient-text">{firstName}</span> 👋
          </h1>
          <p className="text-zinc-400 mt-1">Here's what's happening with your resumes</p>
        </div>
        <Link href="/resume/create" className="btn-primary hidden sm:flex">
          <Plus size={18} /> New Resume
        </Link>
      </div>

      {/* ── Limit Warning ── */}
      {isNearLimit && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/30"
          style={{ background: 'rgba(245,158,11,0.08)' }}>
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-200">
            You&apos;re approaching your monthly usage limit. Consider upgrading for more capacity.
          </p>
        </div>
      )}

      {/* ── Profile Completion ── */}
      {completionPct < 100 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-white">Complete your profile</p>
              <p className="text-sm text-zinc-400 mt-0.5">Better profiles generate better resumes</p>
            </div>
            <span className="text-2xl font-bold gradient-text">{completionPct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${completionPct}%` }} />
          </div>
          <Link href="/profile" className="inline-block mt-3 text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Complete profile →
          </Link>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Resumes Created" value={limits?.resumeUsed || 0} icon={FileText} color="#6c63ff" />
        <StatCard label="API Calls Used" value={limits?.apiUsed || 0} icon={Zap} color="#4ecdc4" />
        <StatCard label="Avg ATS Score" value={avgAts ? `${avgAts}%` : '—'} icon={TrendingUp} color="#10b981" />
      </div>

      {/* ── Usage Bars ── */}
      {limits && (
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-white">Monthly Usage</h2>
          <UsageBar label="Resume Limit" used={limits.resumeUsed} limit={limits.resumeLimit} />
          <UsageBar label="AI API Calls" used={limits.apiUsed} limit={limits.apiLimit} />
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: '/resume/create?type=RESUME', label: 'Create Resume', icon: FileText, color: '#6c63ff' },
          { href: '/resume/create?type=CV', label: 'Create CV', icon: FileText, color: '#4ecdc4' },
          { href: '/templates', label: 'Browse Templates', icon: Layout, color: '#f59e0b' },
        ].map((a) => (
          <Link key={a.href} href={a.href}
            className="card card-hover p-5 flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${a.color}20` }}>
              <a.icon size={20} style={{ color: a.color }} />
            </div>
            <span className="font-medium text-white">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* ── Recent Resumes ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="font-semibold text-white">Recent Resumes</h2>
          <Link href="/resumes" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            View all →
          </Link>
        </div>

        {resumesLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : resumes.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto mb-3 text-zinc-700" />
            <p className="text-zinc-400">No resumes yet</p>
            <Link href="/resume/create" className="btn-primary mt-4 inline-flex">
              <Plus size={16} /> Create your first resume
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {resumes.map((resume) => (
              <div key={resume.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{resume.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {resume.template?.name} · {formatRelativeTime(resume.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {resume.atsScore != null && (
                    <span className={`text-sm font-bold ${getAtsScoreColor(resume.atsScore)}`}>
                      {resume.atsScore}%
                    </span>
                  )}
                  <span className={`badge ${
                    resume.status === 'EXPORTED' ? 'badge-success' :
                    resume.status === 'GENERATED' ? 'badge-primary' : 'badge-warning'
                  }`}>
                    {resume.status}
                  </span>
                </div>
                <Link href={`/resume/${resume.id}/edit`}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                  Edit →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
