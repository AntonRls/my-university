import type { HTMLAttributes } from 'react';

import { cn } from '@shared/utils/className';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-muted/50', className)}
      role="status"
      aria-label="Загрузка"
      {...props}
    />
  );
}


