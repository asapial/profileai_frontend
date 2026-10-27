import Link from "next/link";
import { Bot, Laptop, ArrowUpRight } from "lucide-react";

export function AutomationNavigation({ current }: { current: 'worker' | 'harness' }) {
  return <nav aria-label="Automation workspace" className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
    <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
      {([{ key: 'harness', href: '/dashboard/harness', label: 'Plan & runs', icon: Bot }, { key: 'worker', href: '/dashboard/worker', label: 'Browser & devices', icon: Laptop }] as const).map(item =>
        <Link key={item.key} href={item.href} aria-current={current === item.key ? 'page' : undefined}
          className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${current === item.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          <item.icon className="size-4" />{item.label}
        </Link>)}
    </div>
    <Link href="/dashboard/applications" className="inline-flex min-h-10 items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">Application tracker<ArrowUpRight className="size-3.5" /></Link>
  </nav>;
}
