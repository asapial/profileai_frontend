'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SmartCta — the page's primary CTA primitive.
 *
 * Per Block 0: never a flat fill. Always uses --grad-cta with a 1px inner
 * highlight border at the top edge to suggest glass under light. This is
 * the version used at hero size; the Navbar uses the same link with a
 * smaller size, the AnimatedCta uses it large.
 */
export function SmartCta({
  href,
  label,
  size = 'md',
  className,
  analyticsLabel,
  icon = <ArrowRight size={16} />,
}: {
  href: string;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  analyticsLabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      data-cta={analyticsLabel}
      className={cn(
        'btn-primary group',
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-7 py-3.5 text-base',
        className
      )}
    >
      <span>{label}</span>
      <span className="transition-transform duration-200 group-hover:translate-x-0.5">
        {icon}
      </span>
    </Link>
  );
}