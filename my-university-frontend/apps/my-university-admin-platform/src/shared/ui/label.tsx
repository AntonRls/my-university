/* eslint-env browser */
import type { LabelHTMLAttributes } from 'react';

import { cn } from '@shared/utils/className';

type LabelProps = LabelHTMLAttributes<globalThis.HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn('text-sm font-medium text-muted-foreground', className)} {...props} />;
}


