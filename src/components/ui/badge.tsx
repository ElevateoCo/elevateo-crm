import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
  {
    variants: {
      tone: {
        default: 'bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]',
        accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
        success: 'bg-emerald-50 text-emerald-700',
        warning: 'bg-amber-50 text-amber-700',
        danger: 'bg-red-50 text-red-700',
        info: 'bg-sky-50 text-sky-700',
        violet: 'bg-violet-50 text-violet-700',
        pink: 'bg-pink-50 text-pink-700',
      },
    },
    defaultVariants: { tone: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
