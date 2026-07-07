import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'outline' | 'muted';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[--color-badge-bg] text-[--color-badge-text]',
  outline: 'border border-[--color-border] bg-transparent text-[--color-text-body]',
  muted: 'bg-[--color-bg-surface] text-[--color-text-muted]',
};

/**
 * Badge — the violet pill used for section eyebrows, category tags, etc.
 * Inherits the locked --color-badge-bg/--color-badge-text tokens so it
 * automatically inverts in dark mode.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em]',
        variants[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';
