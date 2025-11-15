/* eslint-env browser */
import type { HTMLAttributes } from 'react';

import { cn } from '@shared/utils/className';

type BadgeProps = HTMLAttributes<globalThis.HTMLSpanElement> & {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize';
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-primary/15 text-primary border border-primary/40',
    secondary: 'bg-secondary/40 text-secondary-foreground',
    outline: 'border border-border text-foreground',
    destructive: 'bg-destructive/15 text-destructive border border-destructive/40',
  };

  return <span className={cn(base, variants[variant], className)} {...props} />;
}


