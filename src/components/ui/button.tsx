import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:pointer-events-none disabled:opacity-40 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
        secondary:
          'bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-3)]',
        ghost: 'hover:bg-[var(--color-surface-3)] text-[var(--color-fg)]',
        danger:
          'bg-[var(--color-danger)] text-white hover:brightness-110 shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
        outline:
          'border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-3)] text-[var(--color-fg)]',
        link: 'text-[var(--color-accent)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-7 px-3 text-xs',
        lg: 'h-11 px-5 text-sm',
        icon: 'h-9 w-9 rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
