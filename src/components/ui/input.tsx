import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1 text-sm placeholder:text-[var(--color-fg-dim)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:border-transparent disabled:opacity-50 transition',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
