'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, LayoutDashboard, LayoutTemplate, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090b]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-4">
          <Link href="/admin" className="flex items-center gap-3 font-bold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500">A</span>
            ProFile Admin
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link key={href} href={href} className={cn('flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium', active ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white')}>
                  <Icon size={16} /> {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-5 lg:p-8">{children}</main>
    </div>
  );
}
