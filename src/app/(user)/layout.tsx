'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Layout, User, LogOut,
  Menu, X, ChevronRight, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resumes', label: 'My Resumes', icon: FileText },
  { href: '/templates', label: 'Templates', icon: Layout },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, loading: logoutLoading } = useLogout();

  return (
    <div className="min-h-screen flex" style={{ background: '#09090b' }}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300',
        'lg:translate-x-0 lg:static',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )} style={{ background: '#111113', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Logo */}
        <div className="flex items-center justify-between p-6 pb-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-base flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6c63ff, #4ecdc4)' }}>
              P
            </div>
            <span className="text-lg font-bold text-white">ProFile AI</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link key={href} href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                  active
                    ? 'text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                )}
                style={active ? {
                  background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(78,205,196,0.1))',
                  border: '1px solid rgba(108,99,255,0.3)',
                } : {}}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} className={active ? 'text-purple-400' : 'text-zinc-500 group-hover:text-zinc-300'} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto text-purple-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={logout}
            disabled={logoutLoading}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            {logoutLoading ? 'Logging out...' : 'Log Out'}
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Content ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-16 sticky top-0 z-30"
          style={{ background: 'rgba(9,9,11,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-zinc-400 hover:text-white transition-colors">
            <Menu size={22} />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
